import { Message, MenuItem, MenuCombo, WeatherContext } from '../../domain/types';

export interface ChatRequest {
  deviceId: string;
  tableCode: string;
  message: string;
  weather?: WeatherContext;
}

export interface ChatResponse {
  sessionId: string;
  message: Message;
  recommendations: MenuItem[];
  combos: MenuCombo[];
} 