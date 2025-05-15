import { 
  SessionRepository,
  ChatRepository,
  FilterService,
  SlotService,
  RecommendationService
} from '@/features/chat/domain/ports';
import { Message } from '@/features/chat/domain/entities/Message';
import { MenuItem } from '@/features/chat/domain/entities/MenuItem';
import { MenuCombo } from '@/features/chat/domain/entities/MenuCombo';
import { v4 as uuidv4 } from 'uuid';
import type { AssistantResponse, ChatSession, WeatherContext } from '../../domain/types';
import { ChatSession as ChatSessionEntity } from '../../domain/entities/ChatSession';
import { MessageSender } from '../../domain/ports/ChatRepository';

interface ChatRequest {
  message: string;
  sessionId?: string;
  alias?: string;
  tableNumber?: string | number;
}

export class ChatUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly chatRepository: ChatRepository,
    private readonly filterService: FilterService,
    private readonly slotService: SlotService,
    private readonly recommendationService: RecommendationService
  ) {}

  async execute(request: ChatRequest): Promise<AssistantResponse> {
    try {
      console.log('ChatUseCase - Request recibida:', request);

      // 1. Obtener o crear sesión
      let session: ChatSession;
      if (request.sessionId) {
        console.log('Intentando obtener sesión existente:', request.sessionId);
        const existingSession = await this.sessionRepository.getSession(request.sessionId);
        if (!existingSession) {
          console.log('Sesión no encontrada, creando nueva sesión');
          if (!request.alias) {
            throw new Error('Se requiere un alias para crear una nueva sesión');
          }
          session = await this.sessionRepository.createSession(
            request.alias,
            request.tableNumber?.toString() || '0'
          );
        } else {
          session = existingSession;
        }
      } else {
        console.log('Creando nueva sesión con alias:', request.alias);
        if (!request.alias) {
          throw new Error('Se requiere un alias para crear una nueva sesión');
        }
        session = await this.sessionRepository.createSession(
          request.alias,
          request.tableNumber?.toString() || '0'
        );
      }

      console.log('Sesión obtenida/creada:', session);

      // 2. Guardar mensaje del usuario
      const userMessage = await this.chatRepository.saveMessage(session.id, request.message, 'user');

      // 3. Obtener historial de mensajes
      const messageHistory = await this.chatRepository.getMessageHistory(session.id);
      console.log('Historial de mensajes:', messageHistory);

      // 4. Obtener contexto del mensaje
      const messageContext = await this.getMessageContext(session.id);

      // 5. Generar respuesta
      const response = await this.generateResponse(request.message, messageContext);

      // 6. Guardar respuesta del asistente
      const aiMessage = await this.chatRepository.saveMessage(session.id, response, 'ai');

      // 7. Obtener recomendaciones y combos
      const recommendations = await this.recommendationService.getRecommendations(session.id);
      const combos = await this.recommendationService.getCombos(session.id);

      return {
        session,
        message: aiMessage,
        recommendations,
        combos
      };
    } catch (error) {
      console.error('Error en ChatUseCase:', error);
      throw error;
    }
  }

  private async getMessageContext(sessionId: string) {
    const previousMessages = await this.chatRepository.getMessageHistory(sessionId);
    const cartItems = await this.chatRepository.getCartItemNames(sessionId);
    const currentSlot = await this.slotService.getCurrentSlot();

    return {
      previousMessages,
      cartItems,
      currentSlot
    };
  }

  private async generateResponse(message: string, context: any): Promise<string> {
    // Implementar lógica de generación de respuesta
    return `Respuesta a: ${message}`;
  }
} 