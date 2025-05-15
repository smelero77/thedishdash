import { SupabaseClient } from '@supabase/supabase-js';
import { ChatSession } from '../types/session.types';
import { CHAT_CONFIG, SYSTEM_CONTEXT } from '../constants/config';
import { supabase } from '@/lib/supabase';

export class ChatSessionService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  async create(sessionId: string, userAlias: string): Promise<ChatSession> {
    const now = new Date().toISOString();
    const sessionData = {
      id: sessionId,
      alias_mesa: userAlias,
      cliente_id: sessionId,
      system_context: SYSTEM_CONTEXT,
      menu_items: null,
      time_of_day: null,
      created_at: now,
      updated_at: now,
      started_at: now,
      last_active: now
    };

    const { data, error } = await this.supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    if (!data) {
      throw new Error('No session data returned after creation');
    }

    return this.mapSessionData(data);
  }

  async update(sessionId: string, data: Partial<ChatSession>): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  async get(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No session found, return null instead of throwing
        return null;
      }
      console.error('Error getting session:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data ? this.mapSessionData(data) : null;
  }

  async validate(sessionId: string): Promise<boolean> {
    try {
      const session = await this.get(sessionId);
      return !!session;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  private mapSessionData(data: any): ChatSession {
    return {
      id: data.id,
      userAlias: data.alias_mesa,
      systemContext: data.system_context || SYSTEM_CONTEXT,
      model: CHAT_CONFIG.model,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastActive: new Date(data.last_active)
    };
  }
} 