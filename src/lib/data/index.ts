import { Slot } from '@/features/chat/domain/types';

export async function getSlots(): Promise<Slot[]> {
  return [
    {
      id: '1',
      name: 'Desayuno',
      startTime: '06:00',
      endTime: '11:00'
    },
    {
      id: '2',
      name: 'Comida',
      startTime: '12:00',
      endTime: '16:00'
    },
    {
      id: '3',
      name: 'Cena',
      startTime: '18:00',
      endTime: '23:00'
    }
  ];
} 