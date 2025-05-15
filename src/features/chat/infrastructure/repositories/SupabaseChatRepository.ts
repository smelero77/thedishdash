import { SupabaseClient } from '@supabase/supabase-js';
import { ChatRepository, MessageSender } from '../../domain/ports/ChatRepository';
import { Message } from '../../domain/entities/Message';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';

interface CartItemWithMenu {
  menu_items: Array<{
    name: string;
  }>;
}

interface MessageData {
  content: string;
}

export class SupabaseChatRepository implements ChatRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getMessageHistory(sessionId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }

    return (data || []).map(msg => Message.fromJSON({
      id: msg.id,
      sessionId: msg.session_id,
      sender: msg.sender as MessageSender,
      content: msg.content,
      createdAt: msg.created_at
    }));
  }

  async getCartItemIds(sessionId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('menu_items')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error getting cart items:', error);
      return [];
    }

    return data?.menu_items?.map((item: any) => item.id) || [];
  }

  async getCartItemNames(sessionId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('menu_items')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error getting cart items:', error);
      return [];
    }

    return data?.menu_items?.map((item: any) => item.name) || [];
  }

  async saveMessage(sessionId: string, content: string, sender: MessageSender): Promise<void> {
    try {
      // Mapear el sender al valor correcto para la base de datos
      const dbSender = sender === 'user' ? 'guest' : sender === 'ai' ? 'assistant' : 'staff';

      const { error } = await supabase
        .from('messages')
        .insert({
          id: uuidv4(),
          session_id: sessionId,
          sender: dbSender,
          content: content,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error al guardar mensaje:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error en saveMessage:', error);
      throw error;
    }
  }

  async getMessages(sessionId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error al obtener mensajes:', error);
        throw error;
      }

      return data.map((msg: MessageData) => msg.content);
    } catch (error) {
      console.error('Error en getMessages:', error);
      throw error;
    }
  }
} 