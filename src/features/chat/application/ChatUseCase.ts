import type { Message, MessageContext } from '../domain/types';
import { CHAT_CONFIG } from '../domain/constants/chat';
import { SupabaseChatRepository } from '../infrastructure/repositories/SupabaseChatRepository';
import { SupabaseSessionRepository } from '../infrastructure/repositories/SupabaseSessionRepository';

export class ChatUseCase {
  constructor(
    private chatRepository: SupabaseChatRepository,
    private sessionRepository: SupabaseSessionRepository
  ) {}

  async initializeSession(customerId: string, tableNumber: string): Promise<string> {
    const existingSession = await this.sessionRepository.getActiveSessionByCustomerId(customerId);
    if (existingSession) {
      return existingSession.id;
    }

    const newSession = await this.sessionRepository.createSession({
      customerId,
      tableNumber,
      startedAt: new Date(),
      lastActive: new Date(),
      systemContext: CHAT_CONFIG.systemPrompt,
      timeOfDay: this.getTimeOfDay(),
      isActive: true
    });

    if (!newSession) {
      throw new Error('Failed to create new session');
    }

    return newSession.id;
  }

  async getMessageHistory(sessionId: string): Promise<Message[]> {
    return this.chatRepository.getMessageHistory(sessionId);
  }

  async sendMessage(sessionId: string, content: string, context: MessageContext): Promise<Message> {
    // Guardar mensaje del usuario
    const userMessage = await this.chatRepository.saveMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      sessionId
    });

    // TODO: Implementar integración con IA
    // Por ahora, devolvemos una respuesta simple
    const aiResponse = await this.chatRepository.saveMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Entiendo tu mensaje: "${content}". Estoy aquí para ayudarte.`,
      timestamp: new Date(),
      sessionId
    });

    return aiResponse;
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }
} 