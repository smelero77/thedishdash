import { SupabaseClient } from '@supabase/supabase-js';
import { SlotRepository } from '@/features/chat/domain/ports';
import { Slot, SlotImpl } from '@/features/chat/domain/entities';

export class SupabaseSlotRepository implements SlotRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getSlotByTime(time: Date): Promise<Slot | null> {
    const { data, error } = await this.supabase
      .from('slots')
      .select('*')
      .lte('start_time', time.toISOString())
      .gte('end_time', time.toISOString())
      .single();

    if (error) {
      console.error('Error getting slot by time:', error);
      return null;
    }

    return new SlotImpl(
      data.id,
      data.name,
      new Date(data.start_time),
      new Date(data.end_time)
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
      new Date(slot.start_time),
      new Date(slot.end_time)
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
      new Date(data.start_time),
      new Date(data.end_time)
    );
  }
} 