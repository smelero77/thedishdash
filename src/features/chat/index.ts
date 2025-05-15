// Exportar tipos
export type {
  Message,
  MessageSender,
  ChatSession,
  TimeOfDay,
  WeatherContext,
  MessageContext,
  AssistantResponse
} from './domain/types';

// Exportar constantes
export { CHAT_CONFIG } from './domain/constants/chat';

// Exportar servicio
export { ChatService } from './application/ChatService'; 