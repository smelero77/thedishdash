import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SearchOverlayProps {
  /** Controla la visibilidad */
  isOpen: boolean;
  /** Cierra el overlay */
  onClose: () => void;
  /** Lanza la búsqueda */
  onSearch: (query: string) => void;
}

export default function SearchOverlay({ isOpen, onClose, onSearch }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    onSearch(q);
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full p-4"
          >
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Buscar en el menú..."
                  className="w-full px-5 py-3 text-lg rounded-full border-[1px] border-[#d0e6e4] focus:outline-none focus:ring-2 focus:ring-[#1ce3cf] focus:border-transparent"
                  style={{ fontFamily: 'Epilogue, "Noto Sans", sans-serif' }}
                />
                <button
                  onClick={handleClose}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#4f968f] hover:text-[#0e1b19] transition-colors"
                  aria-label="Cerrar búsqueda"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 