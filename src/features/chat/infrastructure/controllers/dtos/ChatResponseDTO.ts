import { AssistantResponse } from '@/features/chat/domain/entities';
import { MessageDTO } from './MessageDTO';
import { MenuItemDTO } from './MenuItemDTO';
import { MenuComboDTO } from './MenuComboDTO';

export interface ChatResponseDTO {
  sessionId: string;
  message: MessageDTO;
  recommendations: MenuItemDTO[];
  combos: MenuComboDTO[];
}

export class ChatResponseDTOMapper {
  static toDTO(response: AssistantResponse): ChatResponseDTO {
    return {
      sessionId: response.session.id,
      message: MessageDTO.fromDomain(response.message, response.session.id),
      recommendations: response.recommendations.map(item => MenuItemDTO.fromDomain(item)),
      combos: response.combos.map(combo => MenuComboDTO.fromDomain(combo))
    };
  }
} 