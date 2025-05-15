import { ChatSession } from '../types';

export interface SessionRepository {
  getSession(id: string): Promise<ChatSession | null>;
  getActiveSessionByCustomerId(customerId: string): Promise<ChatSession | null>;
  createSession(session: Omit<ChatSession, 'id'>): Promise<ChatSession>;
  updateSession(session: ChatSession): Promise<ChatSession>;
} 