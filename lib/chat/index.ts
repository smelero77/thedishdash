import { v4 as uuidv4 } from 'uuid';
import { ChatSessionService } from './services/session.service';
import { ChatMessageService } from './services/message.service';
import { OpenAIEmbeddingService } from '../embeddings/services/openai.service';
import { CHAT_CONFIG } from './constants/config';
import { getTimeOfDay } from './utils/time.utils';
import type { AssistantResponse } from './types/response.types';
import type { ChatSession, SessionResponse } from './types/session.types';
import { ExtractedFilters } from './types/extractedFilters.types';

export { ChatSessionService } from './services/session.service';
export { ChatMessageService } from './services/message.service';
export type { AssistantResponse } from './types/response.types';
export type { ChatSession } from './types/session.types';

export class ChatService {
  private static instance: ChatService;
  private sessionService: ChatSessionService;
  private messageService: ChatMessageService;
  private embeddingService: OpenAIEmbeddingService;

  private constructor(
    openaiApiKey: string,
    embeddingConfig: any
  ) {
    this.embeddingService = new OpenAIEmbeddingService(openaiApiKey, embeddingConfig);
    this.sessionService = new ChatSessionService();
    this.messageService = new ChatMessageService(
      openaiApiKey,
      this.embeddingService
    );
  }

  public static getInstance(openaiApiKey?: string, embeddingConfig?: any): ChatService {
    if (!ChatService.instance) {
      if (!openaiApiKey || !embeddingConfig) {
        throw new Error('Se requieren openaiApiKey y embeddingConfig para la primera inicialización');
      }
      ChatService.instance = new ChatService(openaiApiKey, embeddingConfig);
    }
    return ChatService.instance;
  }

  /**
   * Crea una nueva sesión de chat
   */
  public async createSession(tableNumber: string, customerId: string): Promise<SessionResponse> {
    try {
      // TODO: Implementar creación de sesión
      throw new Error('Not implemented');
    } catch (error) {
      return {
        success: false,
        sessionId: '',
        state: {
          currentState: 'error',
          filters: { main_query: '' }, // Valor por defecto requerido
          conversationHistory: []
        },
        metadata: {
          tableNumber,
          timeOfDay: this.getTimeOfDay(),
          lastActive: new Date(),
          sessionDuration: 0
        },
        error: {
          code: 'SESSION_CREATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Procesa un mensaje del usuario y genera una respuesta
   */
  public async processMessage(
    sessionId: string,
    alias: string,
    message: string,
    categoryId?: string
  ): Promise<AssistantResponse> {
    try {
      return await this.messageService.processMessage(sessionId, alias, message, categoryId);
    } catch (error) {
      return {
        type: 'error',
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje.',
        error: {
          code: 'MESSAGE_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Actualiza los filtros de la sesión
   */
  public async updateFilters(
    sessionId: string,
    filters: ExtractedFilters
  ): Promise<SessionResponse> {
    try {
      // TODO: Implementar actualización de filtros
      throw new Error('Not implemented');
    } catch (error) {
      return {
        success: false,
        sessionId,
        state: {
          currentState: 'error',
          filters: { main_query: '' }, // Valor por defecto requerido
          conversationHistory: []
        },
        metadata: {
          tableNumber: '',
          timeOfDay: this.getTimeOfDay(),
          lastActive: new Date(),
          sessionDuration: 0
        },
        error: {
          code: 'FILTER_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Obtiene el estado actual de una sesión
   */
  public async getSessionState(sessionId: string): Promise<ChatSession | null> {
    try {
      // TODO: Implementar obtención de estado de sesión
      throw new Error('Not implemented');
    } catch (error) {
      console.error('Error getting session state:', error);
      return null;
    }
  }

  /**
   * Cierra una sesión de chat
   */
  public async closeSession(sessionId: string): Promise<boolean> {
    try {
      // TODO: Implementar cierre de sesión
      throw new Error('Not implemented');
    } catch (error) {
      console.error('Error closing session:', error);
      return false;
    }
  }

  /**
   * Obtiene la parte del día actual
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }
}

// Exportar la clase ChatService 