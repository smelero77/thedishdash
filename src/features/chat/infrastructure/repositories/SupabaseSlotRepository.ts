import { SupabaseClient } from '@supabase/supabase-js';
import { SlotRepository } from '@/features/chat/domain/ports';
import { Slot, SlotImpl } from '@/features/chat/domain/entities';

export class SupabaseSlotRepository implements SlotRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getSlotByTime(time: Date): Promise<Slot | null> {
    // Convertir la hora actual a formato HH:MM:SS
    const currentTime = time.toTimeString().split(' ')[0];

    const { data, error } = await this.supabase
      .from('slots')
      .select('*')
      .lte('start_time', currentTime)
      .gte('end_time', currentTime)
      .single();

    if (error) {
      console.error('Error getting slot by time:', error);
      return null;
    }

    return new SlotImpl(
      data.id,
      data.name,
      new Date(`1970-01-01T${data.start_time}`),
      new Date(`1970-01-01T${data.end_time}`)
    );
  }

  async getAllSlots(): Promise<Slot[]> {
    const { data, error } = await this.supabase
      .from('slots')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error getting all slots:', error);
      return [];
    }

    return data.map(slot => new SlotImpl(
      slot.id,
      slot.name,
      new Date(`1970-01-01T${slot.start_time}`),
      new Date(`1970-01-01T${slot.end_time}`)
    ));
  }

  async getSlotById(id: string): Promise<Slot | null> {
    const { data, error } = await this.supabase
      .from('slots')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting slot by id:', error);
      return null;
    }

    return new SlotImpl(
      data.id,
      data.name,
      new Date(`1970-01-01T${data.start_time}`),
      new Date(`1970-01-01T${data.end_time}`)
    );
  }
} 