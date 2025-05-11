import { v4 as uuidv4 } from 'uuid';
import { ChatSessionService } from './services/session.service';
import { ChatMessageService } from './services/message.service';
import { OpenAIEmbeddingService } from '../embeddings/services/openai.service';
import { CHAT_CONFIG } from './constants/config';
import { getTimeOfDay } from './utils/time.utils';
import type { AssistantResponse } from './types/response.types';
import type { ChatSession } from './types/session.types';

export { ChatSessionService } from './services/session.service';
export { ChatMessageService } from './services/message.service';
export type { AssistantResponse } from './types/response.types';
export type { ChatSession } from './types/session.types';

export class ChatService {
  private sessionService: ChatSessionService;
  private messageService: ChatMessageService;
  private embeddingService: OpenAIEmbeddingService;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiApiKey: string,
    embeddingConfig: any
  ) {
    this.embeddingService = new OpenAIEmbeddingService(openaiApiKey, embeddingConfig);
    this.sessionService = new ChatSessionService(supabaseUrl, supabaseKey);
    this.messageService = new ChatMessageService(
      supabaseUrl,
      supabaseKey,
      openaiApiKey,
      this.embeddingService
    );
  }

  async processMessage(
    sessionId: string | null,
    userAlias: string,
    userMessage: string,
    categoryId?: string
  ): Promise<{ response: AssistantResponse; sessionId: string }> {
    try {
      // 1. Validación inicial
      if (!userMessage || userMessage.trim().length < 3) {
        return {
          response: {
            type: "assistant_text",
            content: "Por favor, escríbeme algo más descriptivo para poder ayudarte mejor."
          },
          sessionId: sessionId || uuidv4()
        };
      }

      // 2. Gestión de sesión
      const session = await this.getOrCreateSession(sessionId, userAlias);
      if (!session) {
        throw new Error('No se pudo crear o recuperar la sesión');
      }

      // 3. Procesamiento del mensaje
      const response = await this.messageService.processMessage(
        session.id,
        userAlias,
        userMessage,
        categoryId
      );

      return { response, sessionId: session.id };
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      return {
        response: {
          type: "assistant_text",
          content: "Lo siento, hubo un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?"
        },
        sessionId: sessionId || uuidv4()
      };
    }
  }

  private async getOrCreateSession(
    sessionId: string | null,
    userAlias: string
  ): Promise<ChatSession> {
    if (sessionId) {
      const session = await this.sessionService.get(sessionId);
      if (session) {
        await this.sessionService.update(sessionId, {
          lastActive: new Date()
        });
        return session;
      }
    }

    const newSessionId = uuidv4();
    await this.sessionService.create(newSessionId, userAlias);
    const newSession = await this.sessionService.get(newSessionId);
    if (!newSession) {
      throw new Error('No se pudo crear la nueva sesión');
    }
    return newSession;
  }
} 