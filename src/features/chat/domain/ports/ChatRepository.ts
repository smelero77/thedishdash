import { Message } from '../entities/Message';

export type MessageSender = 'user' | 'ai' | 'staff';

export interface ChatRepository {
  // Guardar un mensaje (usuario o sistema)
  saveMessage(sessionId: string, content: string, sender: MessageSender): Promise<void>;

  // Recuperar histórico completo de mensajes para una sesión
  getMessages(sessionId: string): Promise<string[]>;
  getMessageHistory(sessionId: string): Promise<Message[]>;

  // Operaciones de carrito (si las usa ChatUseCase / RecommendationService)
  getCartItemIds(sessionId: string): Promise<string[]>;
  getCartItemNames(sessionId: string): Promise<string[]>;
} 