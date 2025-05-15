import { Message } from '../types';

export interface ChatRepository {
  getMessageHistory(sessionId: string): Promise<Message[]>;
  saveMessage(message: Omit<Message, 'id'> & { sessionId: string }): Promise<Message>;
} 