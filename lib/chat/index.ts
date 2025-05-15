import { v4 as uuidv4 } from 'uuid';
import { ChatSessionService } from './services/ChatSessionService';
import { ChatMessageService } from './services/message.service';
import { OpenAIEmbeddingService } from '../embeddings/services/openai.service';
import { CHAT_CONFIG } from './constants/config';
import { getTimeOfDay } from './utils/time.utils';
import type { AssistantResponse } from './types/response.types';
import type { ChatSession, SessionResponse } from './types/session.types';
import { ExtractedFilters } from './types/extractedFilters.types';

export { ChatSessionService } from './services/ChatSessionService';
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
    this.sessionService = ChatSessionService.getInstance();
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
      const session = await this.sessionService.create(tableNumber, customerId, {
        timeOfDay: this.getTimeOfDay()
      });

      return {
        success: true,
        sessionId: session.id,
        state: {
          currentState: session.state,
          filters: { main_query: '' },
          conversationHistory: session.conversation_history || []
        },
        metadata: {
          tableNumber: session.alias_mesa,
          timeOfDay: this.getTimeOfDay(),
          lastActive: new Date(session.last_active),
          sessionDuration: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        sessionId: '',
        state: {
          currentState: 'error',
          filters: { main_query: '' },
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
      const session = await this.sessionService.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const updatedSession = await this.sessionService.updateState(sessionId, {
        currentState: session.state,
        filters,
        conversationHistory: session.conversation_history || []
      });

      return {
        success: true,
        sessionId: updatedSession.id,
        state: {
          currentState: updatedSession.state,
          filters: updatedSession.current_filters as ExtractedFilters || { main_query: '' },
          conversationHistory: updatedSession.conversation_history || []
        },
        metadata: {
          tableNumber: updatedSession.alias_mesa,
          timeOfDay: this.getTimeOfDay(),
          lastActive: new Date(updatedSession.last_active),
          sessionDuration: this.calculateSessionDuration(updatedSession.started_at)
        }
      };
    } catch (error) {
      return {
        success: false,
        sessionId,
        state: {
          currentState: 'error',
          filters: { main_query: '' },
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
      const session = await this.sessionService.get(sessionId);
      if (!session) {
        return null;
      }

      return {
        id: session.id,
        alias_mesa: session.alias_mesa,
        cliente_id: session.cliente_id,
        started_at: new Date(session.started_at),
        last_active: new Date(session.last_active),
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        system_context: session.system_context,
        state: session.state,
        current_filters: session.current_filters,
        conversation_history: session.conversation_history
      };
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
      await this.sessionService.close(sessionId);
      return true;
    } catch (error) {
      console.error('Error closing session:', error);
      return false;
    }
  }

  /**
   * Calcula la duración de una sesión en minutos
   */
  private calculateSessionDuration(startTime: string | Date): number {
    const start = new Date(startTime);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
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