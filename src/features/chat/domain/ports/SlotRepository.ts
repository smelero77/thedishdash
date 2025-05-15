import { Slot } from '../types';

export interface SlotRepository {
  getAllSlots(): Promise<Slot[]>;
  getSlotById(id: string): Promise<Slot | null>;
  getSlotByTime(time: Date): Promise<Slot | null>;
} 