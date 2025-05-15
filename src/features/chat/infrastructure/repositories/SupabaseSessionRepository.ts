import { SupabaseClient } from '@supabase/supabase-js';
import { SessionRepository } from '@/features/chat/domain/ports';
import { ChatSession, ChatSessionImpl } from '@/features/chat/domain/entities';
import { Slot } from '../../domain/entities/Slot';
import { SlotUtils } from '../../domain/services/SlotUtils';
import { TimeOfDay } from '@/features/chat/domain/types';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseSessionRepository implements SessionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getSession(id: string): Promise<ChatSession | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return new ChatSessionImpl(
      data.id,
      data.cliente_id,
      data.alias_mesa,
      new Date(data.started_at),
      new Date(data.last_active),
      data.system_context || '',
      data.time_of_day as TimeOfDay
    );
  }

  async createSession(clienteId: string, aliasMesa: string): Promise<ChatSession> {
    const validClienteId = uuidv4();
    
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        cliente_id: validClienteId,
        alias_mesa: aliasMesa,
        started_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        system_context: '',
        time_of_day: 'morning' as TimeOfDay
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    return new ChatSessionImpl(
      data.id,
      data.cliente_id,
      data.alias_mesa,
      new Date(data.started_at),
      new Date(data.last_active),
      data.system_context,
      data.time_of_day as TimeOfDay
    );
  }

  async updateSession(session: ChatSession): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({
        last_active: session.lastActive.toISOString(),
        system_context: session.systemContext,
        time_of_day: session.timeOfDay
      })
      .eq('id', session.id);

    if (error) {
      console.error('Error updating session:', error);
      throw error;
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