import { createServerClient } from '@/lib/supabase/server';
import type { Message } from '../../domain/types';
import { CHAT_HISTORY_LIMIT } from '../../domain/constants/chat';

export class SupabaseChatRepository {
  private supabase = createServerClient();

  async getMessageHistory(sessionId: string): Promise<Message[]> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })
        .limit(CHAT_HISTORY_LIMIT);

      if (error) {
        console.error('Error getting message history:', error);
        return [];
      }

      return (data || []).map(message => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: new Date(message.timestamp)
      }));
    } catch (error) {
      console.error('Error in getMessageHistory:', error);
      return [];
    }
  }

  async saveMessage(message: Message & { sessionId: string }): Promise<Message> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert({
          session_id: message.sessionId,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        throw new Error(`Error saving message: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after saving message');
      }

      return {
        id: data.id,
        role: data.role,
        content: data.content,
        timestamp: new Date(data.timestamp)
      };
    } catch (error) {
      console.error('Error in saveMessage:', error);
      throw error;
    }
  }
} 