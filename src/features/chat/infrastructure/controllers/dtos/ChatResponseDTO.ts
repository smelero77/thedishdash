import { AssistantResponse } from '@/features/chat/domain/entities';

export interface ChatResponseDTO {
  sessionId: string;
  message: string;
  recommendations?: string[];
  combos?: string[];
}

export class ChatResponseDTOMapper {
  static toDTO(response: AssistantResponse): ChatResponseDTO {
    return {
      sessionId: response.sessionId,
      message: response.message,
      recommendations: response.recommendations,
      combos: response.combos
    };
  }
} 