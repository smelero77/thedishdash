import { X } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { CartItem } from '@/types/menu';
import { StoryProgress } from './StoryProgress';
import { StoryItem } from './StoryItem';

interface StoryModalProps {
  alias: string;
  items: CartItem[];
  currentIndex: number;
  onClose: () => void;
}

export const StoryModal = ({ alias, items, currentIndex, onClose }: StoryModalProps) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (isClosing) {
    return (
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 1, opacity: 1, y: 0 }}
          animate={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ 
            type: "spring",
            damping: 20,
            stiffness: 200,
            duration: 0.3
          }}
          className="w-full max-w-md bg-white rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#d0e6e4]">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#4f968f] to-[#1ce3cf] p-[2px]">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full bg-[#f8fbfb] flex items-center justify-center">
                    <span className="text-[#4f968f] text-sm sm:text-base font-semibold">
                      {alias.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[#0e1b19] text-sm sm:text-base font-medium">{alias}</span>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 -m-2 text-[#4f968f] hover:bg-[#4f968f]/10 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="relative h-[50vh] sm:h-[60vh]">
            <StoryProgress currentIndex={currentIndex} totalItems={items.length} />
            <div className="h-full">
              <StoryItem item={items[currentIndex]} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ 
          type: "spring",
          damping: 20,
          stiffness: 200,
          duration: 0.3
        }}
        className="w-full max-w-md bg-white rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#d0e6e4]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#4f968f] to-[#1ce3cf] p-[2px]">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-[#f8fbfb] flex items-center justify-center">
                  <span className="text-[#4f968f] text-sm sm:text-base font-semibold">
                    {alias.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[#0e1b19] text-sm sm:text-base font-medium">{alias}</span>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 -m-2 text-[#4f968f] hover:bg-[#4f968f]/10 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="relative h-[50vh] sm:h-[60vh]">
          <StoryProgress currentIndex={currentIndex} totalItems={items.length} />
          <div className="h-full">
            <StoryItem item={items[currentIndex]} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}; 