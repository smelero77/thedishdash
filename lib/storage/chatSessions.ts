import { supabase } from '../supabase';
import { ChatSession, ChatSessionSchema } from '../chat/types/session.types';
import { ConversationTurn } from '../chat/types/response.types';
import { CHAT_SESSION_STATES } from '../chat/constants/config';

export async function getOrCreateChatSession(
  tableId: string,
  customerId: string
): Promise<ChatSession> {
  try {
    // Intentar obtener una sesión existente
    const { data: existingSession, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('alias_mesa', tableId)
      .eq('cliente_id', customerId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingSession) {
      return ChatSessionSchema.parse(existingSession);
    }

    // Crear una nueva sesión si no existe
    const newSession = {
      alias_mesa: tableId,
      cliente_id: customerId,
      started_at: new Date(),
      last_active: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      state: CHAT_SESSION_STATES.INITIAL,
      conversation_history: []
    };

    const { data: createdSession, error: createError } = await supabase
      .from('sessions')
      .insert(newSession)
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return ChatSessionSchema.parse(createdSession);
  } catch (error) {
    console.error('Error en getOrCreateChatSession:', error);
    throw error;
  }
}

export async function addMessageToSession(
  sessionId: string,
  message: ConversationTurn
): Promise<void> {
  try {
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('conversation_history')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const updatedHistory = [...(session.conversation_history || []), message];

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        conversation_history: updatedHistory,
        last_active: new Date(),
        updated_at: new Date()
      })
      .eq('id', sessionId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Error en addMessageToSession:', error);
    throw error;
  }
}

export async function getSessionHistory(sessionId: string): Promise<ConversationTurn[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('conversation_history')
      .eq('id', sessionId)
      .single();

    if (error) {
      throw error;
    }

    return data.conversation_history || [];
  } catch (error) {
    console.error('Error en getSessionHistory:', error);
    throw error;
  }
}

export async function updateSessionState(
  sessionId: string,
  state: typeof CHAT_SESSION_STATES[keyof typeof CHAT_SESSION_STATES],
  filters?: Record<string, unknown>
): Promise<void> {
  try {
    const updateData: Partial<ChatSession> = {
      state,
      last_active: new Date(),
      updated_at: new Date()
    };

    if (filters) {
      updateData.current_filters = filters;
    }

    const { error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error en updateSessionState:', error);
    throw error;
  }
} 