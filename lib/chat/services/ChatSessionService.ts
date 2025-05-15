import { supabase } from '../../supabase';
import { ChatSession, SessionState, SessionMetadata } from '../types/session.types';
import { CHAT_SESSION_STATES } from '../constants/config';

export class ChatSessionService {
  private static instance: ChatSessionService;

  private constructor() {
    // Inicialización privada para singleton
  }

  public static getInstance(): ChatSessionService {
    if (!ChatSessionService.instance) {
      ChatSessionService.instance = new ChatSessionService();
    }
    return ChatSessionService.instance;
  }

  /**
   * Crea una nueva sesión de chat
   */
  public async create(
    tableNumber: string,
    customerId: string,
    metadata?: Partial<SessionMetadata>
  ): Promise<ChatSession> {
    const now = new Date();
    const session: Partial<ChatSession> = {
      alias_mesa: tableNumber,
      cliente_id: customerId,
      started_at: now,
      last_active: now,
      created_at: now,
      updated_at: now,
      state: CHAT_SESSION_STATES.INITIAL,
      conversation_history: [],
      ...metadata
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating session: ${error.message}`);
    }

    return data as ChatSession;
  }

  /**
   * Obtiene una sesión por su ID
   */
  public async get(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Sesión no encontrada
      }
      throw new Error(`Error getting session: ${error.message}`);
    }

    return data as ChatSession;
  }

  /**
   * Actualiza una sesión existente
   */
  public async update(
    sessionId: string,
    updates: Partial<ChatSession>
  ): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating session: ${error.message}`);
    }

    return data as ChatSession;
  }

  /**
   * Actualiza el estado de una sesión
   */
  public async updateState(
    sessionId: string,
    state: SessionState
  ): Promise<ChatSession> {
    return this.update(sessionId, {
      state: state.currentState,
      current_filters: state.filters,
      conversation_history: state.conversationHistory
    });
  }

  /**
   * Cierra una sesión
   */
  public async close(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sessions')
      .update({
        state: CHAT_SESSION_STATES.COMPLETED,
        updated_at: new Date()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Error closing session: ${error.message}`);
    }

    return true;
  }

  /**
   * Obtiene todas las sesiones activas
   */
  public async getActiveSessions(): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .neq('state', CHAT_SESSION_STATES.COMPLETED)
      .order('last_active', { ascending: false });

    if (error) {
      throw new Error(`Error getting active sessions: ${error.message}`);
    }

    return data as ChatSession[];
  }

  /**
   * Limpia las sesiones antiguas
   */
  public async cleanupOldSessions(maxAgeHours: number = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    const { data, error } = await supabase
      .from('sessions')
      .update({
        state: CHAT_SESSION_STATES.COMPLETED,
        updated_at: new Date()
      })
      .lt('last_active', cutoffDate)
      .neq('state', CHAT_SESSION_STATES.COMPLETED)
      .select();

    if (error) {
      throw new Error(`Error cleaning up old sessions: ${error.message}`);
    }

    return data?.length || 0;
  }
}

// Exportar una instancia singleton
export const chatSessionService = ChatSessionService.getInstance(); 