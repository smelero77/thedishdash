import { X } from 'lucide-react';
import Image from 'next/image';
import { CartItem } from '@/types/menu';
import { StoryProgress } from './StoryProgress';
import { StoryItem } from './StoryItem';

interface StoryModalProps {
  alias: string;
  items: CartItem[];
  currentIndex: number;
  onClose: () => void;
}

export const StoryModal = ({ alias, items, currentIndex, onClose }: StoryModalProps) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#d0e6e4]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4f968f] to-[#1ce3cf] p-[2px]">
            <div className="w-full h-full rounded-full bg-white p-[2px]">
              <div className="w-full h-full rounded-full bg-[#f8fbfb] flex items-center justify-center">
                <span className="text-[#4f968f] font-semibold">
                  {alias.slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <span className="text-[#0e1b19] font-medium">{alias}</span>
        </div>
        <button onClick={onClose} className="text-[#4f968f]">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="relative h-[60vh]">
        <StoryProgress currentIndex={currentIndex} totalItems={items.length} />
        <div className="h-full overflow-y-auto">
          {items.map((item, index) => (
            <StoryItem key={index} item={item} />
          ))}
        </div>
      </div>
    </div>
  </div>
); 