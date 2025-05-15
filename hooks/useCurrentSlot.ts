import { useMemo } from 'react';
import { Slot } from '@/types/menu';
import { getCurrentSlot } from '@/utils/slot';

export const useCurrentSlot = (slots: Slot[]) => {
  return useMemo(() => getCurrentSlot(slots), [slots]);
}; 