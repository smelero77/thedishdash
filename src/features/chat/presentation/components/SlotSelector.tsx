import React from 'react';
import { Slot } from '../../domain/types';
import { Clock } from 'lucide-react';

interface SlotSelectorProps {
  slots: Slot[];
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  className?: string;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({
  slots,
  selectedSlotId,
  onSelectSlot,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {slots.map((slot) => (
        <button
          key={slot.id}
          onClick={() => onSelectSlot(slot.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${selectedSlotId === slot.id
              ? 'bg-[#1ce3cf] text-white shadow-lg shadow-[#1ce3cf]/20'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          <Clock className="w-4 h-4" />
          <span>{slot.name}</span>
          <span className="text-xs opacity-75">
            {slot.startTime} - {slot.endTime}
          </span>
        </button>
      ))}
    </div>
  );
}; 