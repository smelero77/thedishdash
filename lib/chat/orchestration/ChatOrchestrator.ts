import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { OpenAIEmbeddingService } from '@/lib/embeddings/services/openai.service';
import { FilterExtractor } from '../processing/FilterExtractor';
import { FilterMapper } from '../processing/FilterMapper';
import { SemanticSearcher } from '../processing/SemanticSearcher';
import { CandidateProcessor } from '../processing/CandidateProcessor';
import { ContextBuilder } from '../processing/ContextBuilder';
import { RecommendationGenerator } from '../processing/RecommendationGenerator';
import { FunctionCallHandler } from '../processing/FunctionCallHandler';
import { AssistantResponse, ConversationTurn } from '../types/response.types';
import { MenuItem } from '@/lib/types/menu';
import { MenuItemData } from '@/types/menu';
import { ChatSession } from '../types/session.types';
import { RpcFilterParameters } from '../types/extractedFilters.types';
import { RECOMMENDATION_SYSTEM_CONTEXT } from '../constants/prompts';
import { CHAT_CONFIG, SYSTEM_MESSAGE_TYPES, CHAT_SESSION_STATES } from '../constants/config';
import { recommendDishesFn, getProductDetailsFn } from '../constants/functions';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ChatSessionService } from '../services/ChatSessionService';

const OPERATION_TIMEOUT = 30000; // 30 segundos
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_TIMEOUT = 60000; // 1 minuto

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

interface CartItemForOrchestrator { 
  menu_item_id: string; 
  quantity: number; 
  menu_items?: { name?: string } | null; 
}

export class ChatOrchestrator {
  private openaiApiKey: string;
  private supabaseClient: SupabaseClient;
  private embeddingService: OpenAIEmbeddingService;
  private filterExtractor: FilterExtractor;
  private filterMapper: FilterMapper;
  private semanticSearcher: SemanticSearcher;
  private candidateProcessor: CandidateProcessor;
  private contextBuilder: ContextBuilder;
  private recommendationGenerator: RecommendationGenerator;
  private functionCallHandler: FunctionCallHandler;
  private chatSessionService: ChatSessionService;
  private logger: Console;
  private circuitBreaker: CircuitBreakerState;

  constructor(
    openaiApiKey: string,
    supabaseClient: SupabaseClient,
    embeddingService: OpenAIEmbeddingService
  ) {
    this.openaiApiKey = openaiApiKey;
    this.supabaseClient = supabaseClient;
    this.embeddingService = embeddingService;
    this.logger = console;
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      isOpen: false
    };

    // Inicializar servicios
    this.filterExtractor = FilterExtractor.getInstance();
    this.filterMapper = FilterMapper.getInstance();
    this.semanticSearcher = SemanticSearcher.getInstance(this.embeddingService, this.supabaseClient);
    this.candidateProcessor = CandidateProcessor.getInstance(this.supabaseClient);
    this.contextBuilder = ContextBuilder.getInstance();
    this.recommendationGenerator = RecommendationGenerator.getInstance(this.openaiApiKey);
    this.functionCallHandler = FunctionCallHandler.getInstance(this.openaiApiKey);
    this.chatSessionService = ChatSessionService.getInstance();
  }

  private async getRawCartItems(userAlias: string): Promise<CartItemForOrchestrator[]> {
    const { data, error } = await this.supabaseClient
      .from("temporary_order_items")
      .select(`menu_item_id, quantity, menu_items!inner(name)`)
      .eq("alias", userAlias);
    
    if (error) {
      this.logger.error('[ChatOrchestrator] Error obteniendo ítems del carrito:', error.message);
      return [];
    }
    return (data || []) as CartItemForOrchestrator[];
  }

  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      operation,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  private async withCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    if (this.circuitBreaker.isOpen) {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure > CIRCUIT_BREAKER_RESET_TIMEOUT) {
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failures = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.circuitBreaker.failures = 0;
      return result;
    } catch (error) {
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailureTime = Date.now();
      
      if (this.circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
        this.circuitBreaker.isOpen = true;
        this.logger.error('[ChatOrchestrator] Circuit breaker opened due to multiple failures');
      }
      
      throw error;
    }
  }

  async processUserMessage(
    session: ChatSession,
    userMessage: string,
    categoryIdFromFrontend?: string
  ): Promise<AssistantResponse> {
    this.logger.debug(`[ChatOrchestrator] Procesando mensaje para sesión ${session.id}, alias ${session.alias}`);
    
    try {
      // Validación inicial del mensaje
      if (userMessage.trim().length < 3) {
        await this.chatSessionService.updateState(session.id, {
          currentState: CHAT_SESSION_STATES.COLLECTING_PREFERENCES,
          filters: { main_query: userMessage.trim() },
          conversationHistory: session.conversation_history || []
        });

        return { 
          type: SYSTEM_MESSAGE_TYPES.CLARIFICATION,
          content: "Por favor, describe un poco más lo que te apetece.",
          clarification_points: ["¿Qué tipo de plato te gustaría?", "¿Tienes alguna preferencia o restricción?"]
        };
      }

      // Extraer filtros del mensaje del usuario
      const extractedFilters = await this.withCircuitBreaker(() =>
        this.withTimeout(
          this.filterExtractor.extractFilters(userMessage, session.conversation_history || []),
          OPERATION_TIMEOUT
        )
      );
      
      // Log detallado para depurar filtros extraídos
      this.logger.debug('[ChatOrchestrator] Filtros extraídos:', {
        price_min: extractedFilters.price_min,
        price_max: extractedFilters.price_max,
        category_names: extractedFilters.category_names,
        main_query: extractedFilters.main_query,
        timestamp: new Date().toISOString()
      });

      // Si hay una categoría en el mensaje actual, actualizar el contexto
      if (extractedFilters.category_names && extractedFilters.category_names.length > 0) {
        if (!session.filters) {
          session.filters = {};
        }
        session.filters.category_names = extractedFilters.category_names;
      }
      // Si no hay categoría en el mensaje actual pero hay una en el contexto, mantenerla
      else if (session.filters?.category_names && session.filters.category_names.length > 0) {
        extractedFilters.category_names = session.filters.category_names;
        
        // Asegurar que la consulta principal incluya la categoría para la búsqueda semántica
        if (!extractedFilters.main_query.toLowerCase().includes('racion')) {
          extractedFilters.main_query = `${session.filters.category_names[0]} ${extractedFilters.main_query}`;
        }
      }

      // Mapear los filtros extraídos a parámetros RPC
      const rpcParameters = await this.withCircuitBreaker(() =>
        this.withTimeout(
          this.filterMapper.mapToRpcParameters(extractedFilters),
          OPERATION_TIMEOUT
        )
      );

      // Asegurar que la categoría se incluya en los parámetros RPC si está en el contexto
      if (session.filters?.category_names && session.filters.category_names.length > 0) {
        const categoryIds = await this.filterMapper.mapCategoryNamesToIds(session.filters.category_names);
        if (categoryIds && categoryIds.length > 0) {
          rpcParameters.p_category_ids_include = categoryIds;
        }
      }
      
      // Log detallado para depurar filtros RPC mapeados
      this.logger.debug('[ChatOrchestrator] Filtros RPC mapeados:', {
        p_price_min: rpcParameters.p_price_min,
        p_price_max: rpcParameters.p_price_max,
        p_item_type: rpcParameters.p_item_type,
        p_category_ids_include: rpcParameters.p_category_ids_include ? `[${rpcParameters.p_category_ids_include.length} ids]` : null,
        p_diet_tag_ids_include: rpcParameters.p_diet_tag_ids_include ? `[${rpcParameters.p_diet_tag_ids_include.length} ids]` : null,
        p_allergen_ids_exclude: rpcParameters.p_allergen_ids_exclude ? `[${rpcParameters.p_allergen_ids_exclude.length} ids]` : null,
        main_query: extractedFilters.main_query,
        timestamp: new Date().toISOString()
      });

      // Actualizar estado a RECOMMENDING después de extraer filtros
      await this.chatSessionService.updateState(session.id, {
        currentState: CHAT_SESSION_STATES.RECOMMENDING,
        filters: extractedFilters,
        conversationHistory: session.conversation_history || []
      });

      // ETAPA 2: Búsqueda Semántica con Filtros Mapeados
      let searchedItems = await this.withCircuitBreaker(() =>
        this.withTimeout(
          this.semanticSearcher.findRelevantItems(extractedFilters.main_query, rpcParameters),
          OPERATION_TIMEOUT
        )
      );

      // Manejo de resultados vacíos
      if (searchedItems.length === 0) {
        const hasActiveFilters = Object.values(rpcParameters).some(
          val => val !== null && val !== undefined && (!Array.isArray(val) || val.length > 0)
        );

        // Volver a COLLECTING_PREFERENCES si no hay resultados
        await this.chatSessionService.updateState(session.id, {
          currentState: CHAT_SESSION_STATES.COLLECTING_PREFERENCES,
          filters: extractedFilters,
          conversationHistory: session.conversation_history || []
        });

        return {
          type: SYSTEM_MESSAGE_TYPES.CLARIFICATION,
          content: hasActiveFilters
            ? "No he encontrado nada que coincida exactamente con tus criterios. ¿Quieres que intente con menos filtros o una descripción diferente?"
            : "No he encontrado nada que coincida con tu búsqueda. ¿Podrías describirme qué te apetece de otra manera?",
          clarification_points: hasActiveFilters
            ? ["¿Quieres que quite algún filtro?", "¿Prefieres buscar algo diferente?"]
            : ["¿Qué tipo de plato te gustaría?", "¿Tienes alguna preferencia de sabor?"]
        };
      }

      // ETAPA 3: Procesamiento de Candidatos y Contexto
      const rawCartItems = await this.getRawCartItems(session.alias);
      
      // Filtrado adicional para mantener categorías en consultas secuenciales
      if (session.filters && session.filters.category_names && 
          session.filters.category_names.length > 0 && session.conversation_history &&
          session.conversation_history.length > 0) {
          
        // Definir estructura para el category_info que sabemos que existe en los datos
        interface CategoryInfo {
          id: string;
          name: string;
        }
        
        // Extender MenuItemData con category_info que sabemos que existe en los datos
        interface ItemWithCategoryInfo extends MenuItemData {
          category_info?: CategoryInfo[];
          similarity?: number;
        }
        
        const previousCategoryNames = session.filters.category_names as string[];
        this.logger.debug('[ChatOrchestrator] Categorías previas de la consulta anterior:', {
          previousCategoryNames,
          timestamp: new Date().toISOString()
        });
        
        // Obtener lista de IDs de categoría basados en nombres previos
        const categoryIds = await this.filterMapper.mapCategoryNamesToIds(previousCategoryNames);
        
        // Filtrar ítems para mantener solo los que pertenecen a las categorías previas
        const filteredItems = searchedItems.filter(item => {
          const itemWithCat = item as unknown as ItemWithCategoryInfo;
          if (!itemWithCat.category_info || !Array.isArray(itemWithCat.category_info)) {
            return false;
          }
          
          // Verificar si alguna categoría del ítem coincide con las categorías previas
          return itemWithCat.category_info.some(cat => 
            categoryIds.includes(cat.id)
          );
        });
        
        // Si hay resultados después del filtrado, usarlos; si no, mantener los originales
        if (filteredItems.length > 0) {
          this.logger.debug('[ChatOrchestrator] Resultados filtrados por categoría previa:', {
            countBefore: searchedItems.length,
            countAfter: filteredItems.length,
            categoriesMaintained: previousCategoryNames,
            timestamp: new Date().toISOString()
          });
          searchedItems = filteredItems;
        } else {
          this.logger.debug('[ChatOrchestrator] No hay resultados después de filtrar por categoría previa, manteniendo resultados originales', {
            timestamp: new Date().toISOString()
          });
        }
      }
      
      const finalCandidates = await this.candidateProcessor.processCandidates(searchedItems, rawCartItems);

      if (finalCandidates.length === 0) {
        // Volver a COLLECTING_PREFERENCES si no hay candidatos finales
        await this.chatSessionService.updateState(session.id, {
          currentState: CHAT_SESSION_STATES.COLLECTING_PREFERENCES,
          filters: extractedFilters,
          conversationHistory: session.conversation_history || []
        });

        return {
          type: SYSTEM_MESSAGE_TYPES.CLARIFICATION,
          content: "Parece que los artículos que coinciden ya están en tu carrito o no hay más opciones con esos filtros.",
          clarification_points: ["¿Quieres ver tu carrito?", "¿Prefieres buscar algo diferente?"]
        };
      }

      // ETAPA 4: Construcción de Contexto y Generación de Recomendación
      const cartContext = this.contextBuilder.buildCartContext(rawCartItems);
      const candidatesBlock = this.contextBuilder.buildCandidatesContextBlock(finalCandidates);

      // Actualizar estado a CONFIRMING antes de generar recomendaciones
      await this.chatSessionService.updateState(session.id, {
        currentState: CHAT_SESSION_STATES.CONFIRMING,
        filters: extractedFilters,
        conversationHistory: session.conversation_history || []
      });

      const messagesForRecommendationAI: ChatCompletionMessageParam[] = [
        { role: 'system', content: RECOMMENDATION_SYSTEM_CONTEXT },
        { role: 'user', content: `Contexto del carrito:\n${cartContext}\n\nCandidatos disponibles:\n${candidatesBlock}\n\nConsulta del usuario: ${userMessage}` }
      ];

      const gptResponseMsg = await this.recommendationGenerator.generateResponse(messagesForRecommendationAI);

      // ETAPA 5: Manejo de Llamadas a Funciones
      if (gptResponseMsg.function_call) {
        const assistantResponse = await this.functionCallHandler.handleFunctionCall(
          gptResponseMsg.function_call.name,
          gptResponseMsg.function_call.arguments,
          { searchedItems }
        );

        // Guardar mensajes en la base de datos
        const now = new Date();
        await this.chatSessionService.update(session.id, {
          conversation_history: [
            ...session.conversation_history || [],
            { role: 'user', content: userMessage, timestamp: now },
            { role: 'assistant', content: String(assistantResponse.content), timestamp: now }
          ]
        });

        return assistantResponse;
      }

      // Si no hay llamada a función, devolver respuesta directa
      const response: AssistantResponse = {
        type: SYSTEM_MESSAGE_TYPES.RECOMMENDATION,
        content: gptResponseMsg.content || "Lo siento, no pude procesar tu solicitud correctamente."
      };

      // Guardar mensajes en la base de datos
      const now = new Date();
      await this.chatSessionService.update(session.id, {
        conversation_history: [
          ...session.conversation_history || [],
          { role: 'user', content: userMessage, timestamp: now },
          { role: 'assistant', content: String(response.content), timestamp: now }
        ]
      });

      return response;

    } catch (error: any) {
      // Actualizar estado a ERROR en caso de error
      await this.chatSessionService.updateState(session.id, {
        currentState: CHAT_SESSION_STATES.ERROR,
        filters: { main_query: userMessage.trim() },
        conversationHistory: session.conversation_history || []
      });

      this.logger.error('[ChatOrchestrator] Error procesando mensaje:', error);
      return {
        type: SYSTEM_MESSAGE_TYPES.ERROR,
        content: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.",
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
} 