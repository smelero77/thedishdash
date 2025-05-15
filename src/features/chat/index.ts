import { v4 as uuidv4 } from 'uuid';
import { SupabaseSessionRepository } from './infrastructure/repositories/SupabaseSessionRepository';
import { SupabaseChatRepository } from './infrastructure/repositories/SupabaseChatRepository';
import { OpenAIService } from './infrastructure/services/OpenAIService';
import { CHAT_CONFIG } from '@/lib/chat/constants/config';
import { getTimeOfDay } from './infrastructure/utils/time.utils';
import { supabase } from '@/lib/supabase/client';
import { ChatUseCase } from './application/use-cases/ChatUseCase';
import { FilterService } from './domain/services/FilterService';
import { SlotService } from './domain/services/SlotService';
import { RecommendationService } from './domain/services/RecommendationService';
import { SupabaseMenuRepository } from './infrastructure/repositories/SupabaseMenuRepository';
import { SupabaseSlotRepository } from './infrastructure/repositories/SupabaseSlotRepository';
import { TimeService } from './infrastructure/services/TimeService';
import type { 
  AssistantResponse, 
  ChatSession, 
  Message, 
  ChatMessageProps,
  WeatherContext,
  MessageContext,
  Slot
} from './domain/types';
import type { MenuCombo } from './domain/entities';

export class ChatService {
  private sessionRepository: SupabaseSessionRepository;
  private chatRepository: SupabaseChatRepository;
  private chatUseCase: ChatUseCase;

  constructor() {
    this.sessionRepository = new SupabaseSessionRepository(supabase);
    this.chatRepository = new SupabaseChatRepository(supabase);
    
    const openAIService = new OpenAIService(process.env.OPENAI_API_KEY || '', {
      model: CHAT_CONFIG.model,
      dimensions: CHAT_CONFIG.dimensions
    });
    const menuRepository = new SupabaseMenuRepository(supabase);
    const slotRepository = new SupabaseSlotRepository(supabase);
    const timeService = new TimeService();
    
    this.chatUseCase = new ChatUseCase(
      this.sessionRepository,
      this.chatRepository,
      new FilterService(openAIService),
      new SlotService(slotRepository, timeService),
      new RecommendationService(menuRepository)
    );
  }

  private async getOrCreateSession(
    sessionId: string | null,
    userAlias: string
  ): Promise<ChatSession | null> {
    console.log('🔄 [ChatService] Obteniendo o creando sesión:', {
      sessionId,
      userAlias,
      timestamp: new Date().toISOString()
    });

    if (sessionId) {
      console.log('🔍 [ChatService] Intentando recuperar sesión existente:', sessionId);
      const session = await this.sessionRepository.getSession(sessionId);
      if (session) {
        console.log('✅ [ChatService] Sesión existente encontrada:', {
          sessionId: session.id,
          userAlias: session.aliasMesa,
          timestamp: new Date().toISOString()
        });
        await this.sessionRepository.updateLastActive(sessionId);
        return session;
      }
      console.log('ℹ️ [ChatService] No se encontró sesión existente, creando nueva');
    }

    // Generar un nuevo UUID para el cliente_id
    const clienteId = uuidv4();
    console.log('🆕 [ChatService] Creando nueva sesión para:', {
      userAlias,
      clienteId,
      timestamp: new Date().toISOString()
    });
    return this.sessionRepository.createSession(clienteId, userAlias);
  }

  async processMessage(
    sessionId: string,
    userAlias: string,
    userMessage: string,
    weather?: WeatherContext,
    categoryId?: string
  ): Promise<{ response: AssistantResponse; sessionId: string }> {
    console.log('📨 [ChatService] Procesando nuevo mensaje:', {
      sessionId,
      userAlias,
      messageLength: userMessage.length,
      hasWeather: !!weather,
      categoryId,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Validación inicial
      if (!userMessage || userMessage.trim().length < 3) {
        console.log('⚠️ [ChatService] Mensaje demasiado corto:', {
          message: userMessage,
          length: userMessage?.length || 0,
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
      const session = await this.getOrCreateSession(sessionId, userAlias);
      if (!session) {
        console.error('❌ [ChatService] Error: No se pudo crear o recuperar la sesión');
        throw new Error('No se pudo crear o recuperar la sesión');
      }

      // 3. Procesamiento del mensaje
      console.log('🤖 [ChatService] Procesando mensaje con IA:', {
        sessionId: session.id,
        messageLength: userMessage.length,
        timestamp: new Date().toISOString()
      });

      const response = await this.chatUseCase.handle({
        clienteId: session.clienteId,
        aliasMesa: session.aliasMesa,
        message: userMessage,
        weather,
        categoryId
      });

      console.log('✅ [ChatService] Mensaje procesado exitosamente:', {
        sessionId: session.id,
        responseType: response.message.type,
        timestamp: new Date().toISOString()
      });

      return { 
        response: response.message,
        sessionId: session.id 
      };
    } catch (error) {
      console.error('❌ [ChatService] Error procesando mensaje:', {
        error,
        sessionId,
        userAlias,
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

// Domain
export * from './domain/entities';
export * from './domain/ports';
export * from './domain/services';

// Application
export * from './application/use-cases';

// Infrastructure
export * from './infrastructure/repositories';
export * from './infrastructure/services';
export * from './infrastructure/utils';
export * from './infrastructure/constants';

// Presentation
export * from './presentation/components';
export * from './presentation/hooks'; 