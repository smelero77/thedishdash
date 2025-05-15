import { WeatherContext } from '@/features/chat/domain/types';
import { Message } from '@/features/chat/domain/entities/Message';
import { MenuItem } from '@/features/chat/domain/entities/MenuItem';
import { MenuCombo } from '@/features/chat/domain/entities/MenuCombo';

export interface ChatRequest {
  deviceId: string;
  tableCode: string;
  message: string;
  weather?: WeatherContext;
  categoryId?: string;
  sessionId?: string;
}

export interface ChatResponseDTO {
  sessionId: string;
  message: Message;
  recommendations: MenuItem[];
  combos: MenuCombo[];
} 