console.log('🚨 LLEGAMOS AL INICIO DE ChatOrchestrator.ts');
console.log('🚨🚨🚨 VERIFICACIÓN: ChatOrchestrator AHORA ESTÁ INTEGRADO EN EL FLUJO PRINCIPAL');

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
import { MessageMetadata } from '../types/session.types';

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
    console.log('🔍 INICIALIZANDO ChatOrchestrator:', { timestamp: new Date().toISOString() });
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
    // Log muy temprano para verificar que llegamos aquí
    console.log('🚨 DEBUG - LLEGAMOS A processUserMessage', {
      sessionId: session.id,
      userMessage,
      categoryIdFromFrontend
    });
    
    try {
      // Log inicial para verificar que llegamos aquí
      console.log('🚨 DEBUG - INICIO processUserMessage', {
        sessionId: session.id,
        userMessage,
        categoryIdFromFrontend
      });

      // 1. Cargar TODO el historial de mensajes
      const messageHistory = await this.chatSessionService.getLastConversationTurns(session.id);
      
      // Log después de cargar el historial
      console.log('🚨 DEBUG - Historial cargado', {
        sessionId: session.id,
        messageCount: messageHistory.length
      });

      // 2. Extraer filtros del mensaje actual
      const extractedFilters = await this.withCircuitBreaker(() =>
        this.withTimeout(
          this.filterExtractor.extractFilters(userMessage, messageHistory),
          OPERATION_TIMEOUT
        )
      );

      // Log de extractedFilters
      console.log('🚨 DEBUG - Filtros extraídos', {
        sessionId: session.id,
        extractedFilters: JSON.parse(JSON.stringify(extractedFilters))
      });

      // Preparar metadatos del mensaje de usuario
      const userMessageMetadata: MessageMetadata = {
        filters: {
          priceMin: extractedFilters.price_min,
          priceMax: extractedFilters.price_max,
          main_query: extractedFilters.main_query,
          category_names: extractedFilters.category_names,
          categoryId: categoryIdFromFrontend
        }
      };

      // Log de userMessageMetadata después de inicialización
      console.log('🚨 DEBUG - userMessageMetadata inicializado', {
        sessionId: session.id,
        userMessageMetadata: JSON.parse(JSON.stringify(userMessageMetadata))
      });

      // Si hay un embedding, añadirlo a los metadatos
      if (extractedFilters.main_query) {
        const embedding = await this.embeddingService.getEmbedding(extractedFilters.main_query);
        if (embedding) {
          userMessageMetadata.embedding = embedding;
          console.log('🚨 DEBUG - Embedding añadido', {
            sessionId: session.id,
            hasEmbedding: true
          });
        }
      }

      // 4. Mapear filtros extraídos a parámetros RPC
      const rpcParameters = await this.withCircuitBreaker(() =>
        this.withTimeout(
          this.filterMapper.mapToRpcParameters(extractedFilters),
          OPERATION_TIMEOUT
        )
      );

      // 5. Búsqueda semántica con filtros acumulados
      let searchedItems = await this.withCircuitBreaker(() =>
        this.withTimeout(
          this.semanticSearcher.findRelevantItems(extractedFilters.main_query, rpcParameters),
          OPERATION_TIMEOUT
        )
      );

      // Log de searchedItems
      console.log('🚨 DEBUG - Resultados de búsqueda', {
        sessionId: session.id,
        itemCount: searchedItems?.length || 0
      });

      // Añadir resultados de búsqueda a la metadata
      if (searchedItems && searchedItems.length > 0) {
        userMessageMetadata.search_results = {
          items: searchedItems.map(item => ({
            id: item.id,
            name: item.name,
            distance: item.similarity || 0
          }))
        };
        console.log('🚨 DEBUG - Search results añadidos', {
          sessionId: session.id,
          resultCount: userMessageMetadata.search_results.items.length
        });
      }

      // Log antes de la copia profunda
      console.log('🚨 DEBUG - Antes de copia profunda', {
        sessionId: session.id,
        userMessageMetadata: JSON.parse(JSON.stringify(userMessageMetadata))
      });

      // Crear una copia profunda del objeto de metadata para asegurar que no se modifique
      const userMessageMetadataToSave = JSON.parse(JSON.stringify(userMessageMetadata));

      // Log después de la copia profunda
      console.log('🚨 DEBUG - Después de copia profunda', {
        sessionId: session.id,
        userMessageMetadataToSave: JSON.parse(JSON.stringify(userMessageMetadataToSave))
      });

      // Log de las propiedades del objeto
      console.log('🚨 DEBUG - Propiedades de userMessageMetadataToSave', {
        sessionId: session.id,
        properties: Object.keys(userMessageMetadataToSave)
      });

      // Log antes de llamar a addMessage
      console.log('🚨 DEBUG - Llamando a addMessage para USER', {
        sessionId: session.id,
        metadata: JSON.parse(JSON.stringify(userMessageMetadataToSave))
      });

      // 3. Guardar mensaje del usuario con sus metadatos
      await this.chatSessionService.addMessage(session.id, {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      }, userMessageMetadataToSave);

      // 6. Procesar candidatos y construir contexto
      const rawCartItems = await this.getRawCartItems(session.alias);
      const finalCandidates = await this.candidateProcessor.processCandidates(searchedItems, rawCartItems);

      // 7. Construir prompt con sistema + historial + usuario
      const cartContext = this.contextBuilder.buildCartContext(rawCartItems);
      const candidatesBlock = this.contextBuilder.buildCandidatesContextBlock(finalCandidates);

      // Construir mensaje de sistema con filtros activos
      const systemMessage = {
        role: 'system' as const,
        content: `Eres un asistente virtual de The Dish Dash. Filtros activos: ${
          Object.entries(userMessageMetadata.filters || {})
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ')
        }. ${cartContext}\n\nCandidatos disponibles:\n${candidatesBlock}`
      };

      // 8. Generar respuesta con OpenAI
      const messages: ChatCompletionMessageParam[] = [
        systemMessage,
        ...messageHistory
          .sort((a, b) => (a.message_index || 0) - (b.message_index || 0))
          .map(msg => ({
            role: msg.role as 'system' | 'user' | 'assistant',
            content: msg.content,
            metadata: msg.metadata
          })),
        { role: 'user', content: userMessage }
      ];

      const gptResponseMsg = await this.recommendationGenerator.generateResponse(messages);

      // 9. Procesar y guardar respuesta del asistente
      let assistantResponse: AssistantResponse;
      let assistantMetadata: MessageMetadata = {};

      // Log inicial de assistantMetadata
      console.log('[ChatOrchestrator] assistantMetadata inicializado', {
        sessionId: session.id,
        assistantMetadata: JSON.parse(JSON.stringify(assistantMetadata))
      });

      // Mantener los filtros activos solo si hay alguno
      if (userMessageMetadata.filters && Object.keys(userMessageMetadata.filters).length > 0) {
        assistantMetadata.filters = { ...userMessageMetadata.filters };
        console.log('[ChatOrchestrator] Filters copiados a assistantMetadata', {
          sessionId: session.id,
          assistantMetadata: JSON.parse(JSON.stringify(assistantMetadata))
        });
      }

      if (gptResponseMsg.function_call) {
        try {
          assistantResponse = await this.functionCallHandler.handleFunctionCall(
            gptResponseMsg.function_call.name,
            gptResponseMsg.function_call.arguments,
            { searchedItems }
          );
        } catch (error) {
          console.error('[ChatOrchestrator] Error procesando function_call:', error);
          // Si falla el procesamiento de la función, intentar usar el contenido como fallback
          assistantResponse = {
            type: SYSTEM_MESSAGE_TYPES.ERROR,
            content: gptResponseMsg.content || "Lo siento, no pude procesar tu solicitud correctamente.",
            error: {
              code: 'FUNCTION_CALL_ERROR',
              message: error instanceof Error ? error.message : 'Error desconocido'
            }
          };
        }
      } else if (gptResponseMsg.content) {
        // Si no hay function_call pero hay contenido, usarlo como respuesta
        assistantResponse = {
          type: SYSTEM_MESSAGE_TYPES.INFO,
          content: gptResponseMsg.content
        };
      } else {
        // Si no hay ni function_call ni contenido, devolver un mensaje de error
        assistantResponse = {
          type: SYSTEM_MESSAGE_TYPES.ERROR,
          content: "Lo siento, no pude procesar tu solicitud correctamente.",
          error: {
            code: 'NO_RESPONSE',
            message: 'No se recibió respuesta válida del modelo'
          }
        };
      }

      // Si hay un embedding para la respuesta, añadirlo a los metadatos
      if (assistantResponse.content) {
        const embedding = await this.embeddingService.getEmbedding(assistantResponse.content);
        if (embedding) {
          assistantMetadata.embedding = embedding;
          console.log('[ChatOrchestrator] Embedding añadido a assistantMetadata', {
            sessionId: session.id,
            hasEmbedding: true
          });
        }
      }

      // Log antes de la copia profunda
      console.log('[ChatOrchestrator] Antes de copia profunda de assistantMetadata', {
        sessionId: session.id,
        assistantMetadata: JSON.parse(JSON.stringify(assistantMetadata))
      });

      // Crear una copia profunda del objeto de metadata para asegurar que no se modifique
      const assistantMetadataToSave = JSON.parse(JSON.stringify(assistantMetadata));

      // Log después de la copia profunda
      console.log('[ChatOrchestrator] Después de copia profunda de assistantMetadata', {
        sessionId: session.id,
        assistantMetadataToSave: JSON.parse(JSON.stringify(assistantMetadataToSave))
      });

      // Log de las propiedades del objeto
      console.log('[ChatOrchestrator] Propiedades de assistantMetadataToSave', {
        sessionId: session.id,
        properties: Object.keys(assistantMetadataToSave)
      });

      // Log antes de llamar a addMessage
      console.log('[ChatOrchestrator] Llamando a addMessage para ASSISTANT', {
        sessionId: session.id,
        metadata: JSON.parse(JSON.stringify(assistantMetadataToSave))
      });

      // Guardar respuesta del asistente con metadatos
      await this.chatSessionService.addMessage(session.id, {
        role: 'assistant',
        content: assistantResponse.content || '',
        timestamp: new Date()
      }, assistantMetadataToSave);

      return assistantResponse;

    } catch (error) {
      this.logger.error('[ChatOrchestrator] Error procesando mensaje:', error);
      
      // Guardar mensaje de error como sistema con metadatos de error
      await this.chatSessionService.addMessage(session.id, {
        role: 'system',
        content: 'Error procesando mensaje: ' + (error instanceof Error ? error.message : 'Unknown error'),
        timestamp: new Date()
      }, { 
        error: true,
        errorDetails: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });

      return {
        type: 'error',
        content: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.",
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
} 