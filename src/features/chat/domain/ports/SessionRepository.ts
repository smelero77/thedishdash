import { ChatSession } from '../types';
import { Slot } from '../entities/Slot';

export interface SessionRepository {
  // Gestión de sesiones
  getSession(id: string): Promise<ChatSession | null>;
  createSession(clienteId: string, aliasMesa: string): Promise<ChatSession>;
  updateLastActive(id: string): Promise<void>;
  updateSession(session: ChatSession): Promise<void>;
  
  // Gestión de slots
  getAllSlots(): Promise<Slot[]>;
  detectSlotFromMessage(message: string, slots: Slot[]): string | null;
} 