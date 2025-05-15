import { Slot } from '../entities/Slot';
import { SlotRepository } from '../repositories/SlotRepository';
import { TimeProvider } from '../ports/TimeProvider';
import { SlotUtils } from './SlotUtils';

export class SlotService {
  constructor(
    private readonly slotRepository: SlotRepository,
    private readonly timeProvider: TimeProvider
  ) {}

  async getCurrentSlot(): Promise<Slot | null> {
    const currentTime = this.timeProvider.getCurrentTime();
    return this.slotRepository.getSlotByTime(currentTime);
  }

  async getSlotFromTime(): Promise<Slot | null> {
    const timeOfDay = this.timeProvider.getCurrentTimeOfDay();
    const slots = await this.slotRepository.getAllSlots();
    const slotId = SlotUtils.detectSlotFromTimeOfDay(timeOfDay, slots);
    
    if (!slotId) return null;
    
    return this.slotRepository.getSlotById(slotId);
  }

  async getSlotFromMessage(message: string): Promise<Slot | null> {
    const slots = await this.slotRepository.getAllSlots();
    const slotId = SlotUtils.detectSlotFromMessage(message, slots);
    
    if (!slotId) return null;
    
    return this.slotRepository.getSlotById(slotId);
  }
} 