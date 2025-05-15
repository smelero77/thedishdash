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
import { ChatSession } from '../types/session.types';
import { RpcFilterParameters } from '../types/extractedFilters.types';
import { RECOMMENDATION_SYSTEM_CONTEXT } from '../constants/prompts';
import { CHAT_CONFIG, SYSTEM_MESSAGE_TYPES } from '../constants/config';
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
    this.logger.debug(`[ChatOrchestrator] Procesando mensaje para sesión ${session.id}, alias ${session.alias_mesa}`);
    
    try {
      // Validación inicial del mensaje
      if (userMessage.trim().length < 3) {
        return { 
          type: SYSTEM_MESSAGE_TYPES.CLARIFICATION,
          content: "Por favor, describe un poco más lo que te apetece.",
          clarification_points: ["¿Qué tipo de plato te gustaría?", "¿Tienes alguna preferencia o restricción?"]
        };
      }

      // ETAPA 1: Extracción y Mapeo de Filtros
      const extractedFilters = await this.withCircuitBreaker(() =>
        this.withTimeout(
          this.filterExtractor.extractFilters(userMessage),
          OPERATION_TIMEOUT
        )
      );

      const mainQueryForEmbedding = extractedFilters.main_query;
      const rpcMappedParams = await this.withCircuitBreaker(() =>
        this.withTimeout(
          this.filterMapper.mapToRpcParameters(extractedFilters),
          OPERATION_TIMEOUT
        )
      );

      // ETAPA 2: Búsqueda Semántica con Filtros Mapeados
      let searchedItems = await this.withCircuitBreaker(() =>
        this.withTimeout(
          this.semanticSearcher.findRelevantItems(mainQueryForEmbedding, rpcMappedParams),
          OPERATION_TIMEOUT
        )
      );

      // Manejo de resultados vacíos
      if (searchedItems.length === 0) {
        const hasActiveFilters = Object.values(rpcMappedParams).some(
          val => val !== null && val !== undefined && (!Array.isArray(val) || val.length > 0)
        );

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
      const rawCartItems = await this.getRawCartItems(session.alias_mesa);
      const finalCandidates = await this.candidateProcessor.processCandidates(searchedItems, rawCartItems);

      if (finalCandidates.length === 0) {
        return {
          type: SYSTEM_MESSAGE_TYPES.CLARIFICATION,
          content: "Parece que los artículos que coinciden ya están en tu carrito o no hay más opciones con esos filtros.",
          clarification_points: ["¿Quieres ver tu carrito?", "¿Prefieres buscar algo diferente?"]
        };
      }

      // ETAPA 4: Construcción de Contexto y Generación de Recomendación
      const cartContext = this.contextBuilder.buildCartContext(rawCartItems);
      const candidatesBlock = this.contextBuilder.buildCandidatesContextBlock(finalCandidates);

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
          { role: 'user', content: userMessage, timestamp: now },
          { role: 'assistant', content: String(response.content), timestamp: now }
        ]
      });

      return response;

    } catch (error: any) {
      this.logger.error('[ChatOrchestrator] Error en processUserMessage:', error.message, error.stack);
      return {
        type: SYSTEM_MESSAGE_TYPES.ERROR,
        content: "Hubo un problema procesando tu solicitud. Por favor, inténtalo más tarde."
      };
    }
  }
} 