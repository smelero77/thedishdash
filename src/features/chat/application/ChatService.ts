import { v4 as uuidv4 } from 'uuid';
import { SupabaseSessionRepository } from '../infrastructure/repositories/SupabaseSessionRepository';
import { SupabaseChatRepository } from '../infrastructure/repositories/SupabaseChatRepository';
import { ChatUseCase } from './ChatUseCase';
import type { 
  AssistantResponse, 
  ChatSession, 
  WeatherContext,
  MessageContext
} from '../domain/types';

export class ChatService {
  private sessionRepository: SupabaseSessionRepository;
  private chatRepository: SupabaseChatRepository;
  private chatUseCase: ChatUseCase;

  constructor() {
    this.sessionRepository = new SupabaseSessionRepository();
    this.chatRepository = new SupabaseChatRepository();
    this.chatUseCase = new ChatUseCase(this.chatRepository, this.sessionRepository);
  }

  private async getOrCreateSession(
    sessionId: string | null,
    customerId: string,
    tableNumber: string
  ): Promise<ChatSession | null> {
    console.log('🔄 [ChatService] Obteniendo o creando sesión:', {
      sessionId,
      customerId,
      tableNumber,
      timestamp: new Date().toISOString()
    });

    if (sessionId) {
      console.log('🔍 [ChatService] Intentando recuperar sesión existente:', sessionId);
      const session = await this.sessionRepository.getSession(sessionId);
      if (session) {
        console.log('✅ [ChatService] Sesión existente encontrada:', {
          sessionId: session.id,
          customerId: session.customerId,
          tableNumber: session.tableNumber,
          timestamp: new Date().toISOString()
        });
        return session;
      }
      console.log('ℹ️ [ChatService] No se encontró sesión existente, creando nueva');
    }

    console.log('🆕 [ChatService] Creando nueva sesión para:', {
      customerId,
      tableNumber,
      timestamp: new Date().toISOString()
    });

    return this.sessionRepository.createSession({
      customerId,
      tableNumber,
      startedAt: new Date(),
      lastActive: new Date(),
      systemContext: '',
      timeOfDay: 'afternoon'
    });
  }

  async processMessage(
    sessionId: string | null,
    customerId: string,
    tableNumber: string,
    message: string,
    context: MessageContext
  ): Promise<{ response: AssistantResponse; sessionId: string }> {
    console.log('📨 [ChatService] Procesando nuevo mensaje:', {
      sessionId,
      customerId,
      tableNumber,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Validación inicial
      if (!message || message.trim().length < 3) {
        console.log('⚠️ [ChatService] Mensaje demasiado corto:', {
          message,
          length: message?.length || 0,
          timestamp: new Date().toISOString()
        });
        return {
          response: {
            type: "assistant_text",
            data: {
              text: "Por favor, escríbeme algo más descriptivo para poder ayudarte mejor."
            }
          },
          sessionId: sessionId || uuidv4()
        };
      }

      // 2. Gestión de sesión
      console.log('🔄 [ChatService] Gestionando sesión');
      const session = await this.getOrCreateSession(sessionId, customerId, tableNumber);
      if (!session) {
        console.error('❌ [ChatService] Error: No se pudo crear o recuperar la sesión');
        throw new Error('No se pudo crear o recuperar la sesión');
      }

      // 3. Procesamiento del mensaje
      console.log('🤖 [ChatService] Procesando mensaje:', {
        sessionId: session.id,
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });

      const response = await this.chatUseCase.sendMessage(session.id, message, context);

      console.log('✅ [ChatService] Mensaje procesado exitosamente:', {
        sessionId: session.id,
        timestamp: new Date().toISOString()
      });

      return { 
        response: {
          type: "assistant_text",
          data: {
            text: response.content.data.text
          }
        },
        sessionId: session.id 
      };
    } catch (error) {
      console.error('❌ [ChatService] Error procesando mensaje:', {
        error,
        sessionId,
        customerId,
        tableNumber,
        timestamp: new Date().toISOString()
      });
      return {
        response: {
          type: "assistant_text",
          data: {
            text: "Lo siento, hubo un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?"
          }
        },
        sessionId: sessionId || uuidv4()
      };
    }
  }
} 