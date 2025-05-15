import { SupabaseClient } from '@supabase/supabase-js';
import { SessionRepository } from '@/features/chat/domain/repositories/SessionRepository';
import { ChatSession } from '@/features/chat/domain/types';
import { Slot } from '../../domain/entities/Slot';
import { SlotUtils } from '../../domain/services/SlotUtils';
import { TimeOfDay } from '@/features/chat/domain/types';
import { v4 as uuidv4 } from 'uuid';
import { createServerClient } from '@/lib/supabase/server';
import { CHAT_HISTORY_LIMIT } from '../../domain/constants/chat';

export class SupabaseSessionRepository implements SessionRepository {
  private supabase = createServerClient();

  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        customerId: data.customer_id,
        tableNumber: data.table_number,
        startedAt: new Date(data.started_at),
        lastActive: new Date(data.last_active),
        systemContext: data.system_context,
        timeOfDay: data.time_of_day,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Error in getSession:', error);
      return null;
    }
  }

  async getActiveSessionByCustomerId(customerId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('last_active', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error getting active session:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        customerId: data.customer_id,
        tableNumber: data.table_number,
        startedAt: new Date(data.started_at),
        lastActive: new Date(data.last_active),
        systemContext: data.system_context,
        timeOfDay: data.time_of_day,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Error in getActiveSessionByCustomerId:', error);
      return null;
    }
  }

  async createSession(session: Omit<ChatSession, 'id'>): Promise<ChatSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert({
          customer_id: session.customerId,
          table_number: session.tableNumber,
          started_at: session.startedAt.toISOString(),
          last_active: session.lastActive.toISOString(),
          system_context: session.systemContext,
          time_of_day: session.timeOfDay,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        customerId: data.customer_id,
        tableNumber: data.table_number,
        startedAt: new Date(data.started_at),
        lastActive: new Date(data.last_active),
        systemContext: data.system_context,
        timeOfDay: data.time_of_day,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }

  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .update({
          customer_id: updates.customerId,
          table_number: updates.tableNumber,
          last_active: updates.lastActive?.toISOString(),
          system_context: updates.systemContext,
          time_of_day: updates.timeOfDay,
          is_active: updates.isActive
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating session:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        customerId: data.customer_id,
        tableNumber: data.table_number,
        startedAt: new Date(data.started_at),
        lastActive: new Date(data.last_active),
        systemContext: data.system_context,
        timeOfDay: data.time_of_day,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Error in updateSession:', error);
      return null;
    }
  }

  async updateLastActive(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({ last_active: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating last active:', error);
      throw error;
    }
  }

  detectSlotFromMessage(message: string, slots: Slot[]): string | null {
    return SlotUtils.detectSlotFromMessage(message, slots);
  }

  async getAllSlots(): Promise<Slot[]> {
    const { data, error } = await this.supabase
      .from('slots')
      .select('*')
      .order('start_time');

    if (error) throw error;

    return data.map((slot: { id: string; name: string; start_time: string; end_time: string }) => ({
      id: slot.id,
      name: slot.name,
      startTime: slot.start_time,
      endTime: slot.end_time
    }));
  }
} 