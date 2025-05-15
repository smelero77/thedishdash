import { Slot } from '../entities/Slot';

export class SlotUtils {
  private static readonly SLOT_KEYWORDS: Record<string, string[]> = {
    'Desayuno': ['desayuno', 'desayunar', 'desayunamos'],
    'Almuerzo': ['almuerzo', 'almorzar', 'almorzamos'],
    'Cena': ['cena', 'cenar', 'cenamos']
  };

  private static readonly TIME_OF_DAY_MAP: Record<string, string[]> = {
    'morning': ['Desayuno', 'Brunch'],
    'afternoon': ['Almuerzo'],
    'evening': ['Cena'],
    'night': ['Cena Tardía']
  };

  static detectSlotFromMessage(message: string, slots: Slot[]): string | null {
    const lowerMessage = message.toLowerCase();
    for (const [slotName, keywords] of Object.entries(this.SLOT_KEYWORDS)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        const slot = slots.find(s => s.name.toLowerCase().includes(slotName.toLowerCase()));
        return slot?.id || null;
      }
    }
    return null;
  }

  static detectSlotFromTimeOfDay(timeOfDay: string, slots: Slot[]): string | null {
    const possibleSlots = this.TIME_OF_DAY_MAP[timeOfDay] || [];
    const matchingSlot = slots.find(slot => 
      possibleSlots.some(name => slot.name.toLowerCase().includes(name.toLowerCase()))
    );
    return matchingSlot?.id || null;
  }

  static getCurrentSlot(slots: Slot[], currentDate: Date = new Date()): Slot | null {
    if (!slots || slots.length === 0) return null;

    const currentTimeInMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

    return slots.find(slot => {
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      const slotStartMinutes = startHour * 60 + startMinute;
      const slotEndMinutes = endHour * 60 + endMinute;

      if (isNaN(slotStartMinutes) || isNaN(slotEndMinutes)) {
        console.warn(`[SlotUtils] Slot con ID ${slot.id} ('${slot.name}') tiene tiempos inválidos: ${slot.startTime} - ${slot.endTime}`);
        return false;
      }

      if (slotEndMinutes < slotStartMinutes) {
        return currentTimeInMinutes >= slotStartMinutes || currentTimeInMinutes < slotEndMinutes;
      } else {
        return currentTimeInMinutes >= slotStartMinutes && currentTimeInMinutes < slotEndMinutes;
      }
    }) || null;
  }
} 