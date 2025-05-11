import { supabase } from '../supabase';
import { ChatMessage } from '../llm/generateResponse';

export interface ChatSession {
  id: string;
  table_id: string;
  customer_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export async function getOrCreateChatSession(
  tableId: string,
  customerId: string
): Promise<ChatSession> {
  try {
    // Intentar obtener una sesión existente
    const { data: existingSession, error: fetchError } = await supabase
      .from('gpt_chat_sessions')
      .select('*')
      .eq('table_id', tableId)
      .eq('customer_id', customerId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingSession) {
      return existingSession;
    }

    // Crear una nueva sesión si no existe
    const { data: newSession, error: createError } = await supabase
      .from('gpt_chat_sessions')
      .insert({
        table_id: tableId,
        customer_id: customerId,
        messages: []
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newSession;
  } catch (error) {
    console.error('Error en getOrCreateChatSession:', error);
    throw error;
  }
}

export async function addMessageToSession(
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  try {
    const { error } = await supabase
      .from('gpt_chat_sessions')
      .update({
        messages: supabase.raw('messages || ?', [message]),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error en addMessageToSession:', error);
    throw error;
  }
}

export async function getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('gpt_chat_sessions')
      .select('messages')
      .eq('id', sessionId)
      .single();

    if (error) {
      throw error;
    }

    return data.messages || [];
  } catch (error) {
    console.error('Error en getSessionHistory:', error);
    throw error;
  }
} 