import type { ChatRequest, ChatResponseDTO } from '@/features/chat/infrastructure/controllers/types';
import { ChatUseCase } from '@/features/chat/application/use-cases';
import { Message } from '@/features/chat/domain/entities/Message';
import { MenuItem } from '@/features/chat/domain/entities/MenuItem';
import { MenuCombo } from '@/features/chat/domain/entities/MenuCombo';

export class ChatController {
  constructor(private chatUseCase: ChatUseCase) {}

  async handleChat(requestDto: ChatRequest): Promise<ChatResponseDTO> {
    console.log('ChatController - Request recibido:', requestDto);

    if (!requestDto.message) {
      throw new Error('El mensaje es requerido');
    }

    try {
      const response = await this.chatUseCase.execute({
        message: requestDto.message,
        sessionId: requestDto.sessionId,
        alias: requestDto.deviceId,
        tableNumber: requestDto.tableCode
      });

      const message = new Message(
        Date.now().toString(),
        requestDto.sessionId || '',
        'assistant',
        response.data.text || 'Lo siento, no pude procesar tu mensaje'
      );

      return {
        sessionId: requestDto.sessionId || '',
        message,
        recommendations: response.data.menuItems || [],
        combos: [] as MenuCombo[]
      };
    } catch (error) {
      console.error('Error en ChatController:', error);
      throw error;
    }
  }
} 