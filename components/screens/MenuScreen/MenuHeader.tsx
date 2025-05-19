import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { UserCircle } from 'lucide-react';
import SearchButton from '../SearchButton';

interface Slot {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
}

interface MenuHeaderProps {
  alias: string | null | undefined;
  tableNumber: number;
  currentSlot: Slot | null;
  slots: Slot[];
  onAliasClick: () => void;
  setSearchActive: (active: boolean) => void;
  style?: React.CSSProperties;
}

const MenuHeaderComponent = forwardRef<HTMLDivElement, MenuHeaderProps>(
  ({ alias, tableNumber, currentSlot, slots, onAliasClick, setSearchActive }, ref) => {
    return (
      <div className="fixed top-0 left-0 right-0 z-10 bg-[#f8fbfb]" style={{ height: '120px' }}>
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <img
              src="https://kgmacxloazibdyduucgp.supabase.co/storage/v1/object/public/images/logo/logo_gourmeton.webp"
              alt="Gourmeton Logo"
              className="h-10"
            />
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <SearchButton onClick={() => setSearchActive(true)} />
              {alias ? (
                <motion.button
                  onClick={onAliasClick}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex items-center justify-center w-10 h-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
                  aria-label="Cambiar alias"
                >
                  <span className="text-[#4f968f] font-semibold text-sm">
                    {alias.split(' ')[0].slice(0, 2).toUpperCase()}
                  </span>
                </motion.button>
              ) : (
                <motion.button
                  onClick={onAliasClick}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex items-center justify-center w-10 h-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
                  aria-label="Definir alias"
                >
                  <UserCircle className="h-5 w-5 text-[#4f968f]" />
                </motion.button>
              )}
            </div>
            <p className="text-[#4f968f] text-sm font-medium mt-1 mr-1">
              Mesa <span className="font-bold">{tableNumber}</span>
            </p>
          </div>
        </div>

        {currentSlot && (
          <div className="px-4 pb-2">
            <p className="text-[#0e1b19] text-sm font-bold">
              {slots
                .filter((slot) => {
                  const [startHour, startMinute] = slot.start_time.split(':').map(Number);
                  const [endHour, endMinute] = slot.end_time.split(':').map(Number);
                  const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
                  const slotStart = startHour * 60 + startMinute;
                  const slotEnd = endHour * 60 + endMinute;
                  return currentTime >= slotStart && currentTime < slotEnd;
                })
                .map((slot) => slot.name)
                .join(' & ')}
            </p>
          </div>
        )}
      </div>
    );
  },
);

MenuHeaderComponent.displayName = 'MenuHeader';
export default React.memo(MenuHeaderComponent);
