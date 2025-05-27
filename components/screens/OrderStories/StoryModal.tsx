import { X } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CartItem } from '@/types/menu';
import { ScrollProgressBar } from '../../../components/ScrollProgressBar';
import { StoryItem } from './StoryItem';
import { OrderTotal } from './OrderTotal';
import { ItemQuantity } from './ItemQuantity';

interface StoryModalProps {
  alias: string;
  items: CartItem[];
  currentIndex: number;
  onClose: () => void;
}

export const StoryModal = ({
  alias,
  items,
  currentIndex: initialIndex,
  onClose,
}: StoryModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [visibleItems, setVisibleItems] = useState<CartItem[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const loadItems = async () => {
        for (let i = 1; i <= items.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          setVisibleItems(items.slice(0, i));
        }
      };
      loadItems();
    }
  }, [isVisible, items]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-white/20">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4f968f] to-[#1ce3cf] p-[2px]">
                    <div className="w-full h-full rounded-full bg-white p-[2px]">
                      <div className="w-full h-full rounded-full bg-[#f8fbfb] flex items-center justify-center">
                        <span className="text-[#4f968f] text-base font-semibold">
                          {alias.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[#0e1b19] text-lg font-medium">{alias}</span>
                </div>
                <div className="flex items-center gap-3">
                  <OrderTotal items={items} visibleItems={visibleItems} />
                  <button
                    onClick={handleClose}
                    className="p-2 -m-2 text-[#4f968f] hover:bg-[#4f968f]/10 rounded-full transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <ScrollProgressBar
                containerRef={contentRef}
                className="sticky top-0 z-10"
                barClassName="bg-[#4f968f]"
                trackClassName="bg-[#d0e6e4]/20"
              />
            </div>

            <div
              ref={contentRef}
              className="h-[calc(100vh-200px)] overflow-y-auto no-scrollbar pt-24 pb-8 px-4"
            >
              <div className="space-y-4">
                {visibleItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      damping: 25,
                      stiffness: 150,
                      delay: index * 0.05,
                    }}
                  >
                    <StoryItem item={item} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
