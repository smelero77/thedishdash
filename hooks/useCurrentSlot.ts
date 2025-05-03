import { useMemo } from 'react';
import { Slot } from '@/types/menu';

export const useCurrentSlot = (slots: Slot[]) => {
  return useMemo(() => {
    if (!slots || slots.length === 0) {
      return null;
    }

    const currentTimeInMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    const activeSlot = slots.find(slot => {
      const [startHour, startMinute] = slot.start_time.split(':').map(Number);
      const [endHour, endMinute] = slot.end_time.split(':').map(Number);
      const slotStartMinutes = startHour * 60 + startMinute;
      const slotEndMinutes = endHour * 60 + endMinute;

      if (isNaN(slotStartMinutes) || isNaN(slotEndMinutes)) {
        console.warn(`[useCurrentSlot] Slot con ID ${slot.id} ('${slot.name}') tiene tiempos inválidos: ${slot.start_time} - ${slot.end_time}`);
        return false;
      }

      if (slotEndMinutes < slotStartMinutes) {
        return currentTimeInMinutes >= slotStartMinutes || currentTimeInMinutes < slotEndMinutes;
      } else {
        return currentTimeInMinutes >= slotStartMinutes && currentTimeInMinutes < slotEndMinutes;
      }
    });

    return activeSlot || null;
  }, [slots]);
}; 