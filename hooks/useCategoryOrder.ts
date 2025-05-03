import { useMemo } from 'react';
import { Category, Slot } from '@/types/menu';

interface UseCategoryOrderProps {
  categories: Category[];
  slots: Slot[];
  currentSlot: Slot | null;
}

export const useCategoryOrder = ({ categories, slots, currentSlot }: UseCategoryOrderProps) => {
  return useMemo(() => {
    const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
    
    return [...categories].sort((a, b) => {
      // 1. Ordenar por complementario
      if (a.is_complementary && !b.is_complementary) return 1;
      if (!a.is_complementary && b.is_complementary) return -1;

      // 2. Verificar si están en el slot actual
      const isInCurrentSlot = (category: Category) => {
        return slots.some(slot => {
          const [startHour, startMinute] = slot.start_time.split(':').map(Number);
          const [endHour, endMinute] = slot.end_time.split(':').map(Number);
          const start = startHour * 60 + startMinute;
          const end = endHour * 60 + endMinute;
          const inSlot = currentTime >= start && currentTime < end;
          return inSlot && category.slot_categories?.some(sc => sc.slot_id === slot.id);
        });
      };

      // 3. Ordenar por slot actual
      const aInCurrentSlot = isInCurrentSlot(a);
      const bInCurrentSlot = isInCurrentSlot(b);
      if (aInCurrentSlot && !bInCurrentSlot) return -1;
      if (!aInCurrentSlot && bInCurrentSlot) return 1;

      // 4. Ordenar por distancia al siguiente slot
      const getClosestSlotMinutes = (category: Category) => {
        const distances = slots
          .filter(slot => category.slot_categories?.some(sc => sc.slot_id === slot.id))
          .map(slot => {
            const [startHour, startMinute] = slot.start_time.split(':').map(Number);
            const start = startHour * 60 + startMinute;
            return start < currentTime ? 100000 : start - currentTime;
          });
        return distances.length ? Math.min(...distances) : 999999;
      };

      const aDistance = getClosestSlotMinutes(a);
      const bDistance = getClosestSlotMinutes(b);
      if (aDistance !== bDistance) return aDistance - bDistance;

      // 5. Ordenar por sort_order
      return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
    });
  }, [categories, slots, currentSlot]);
}; 