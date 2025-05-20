// thedishdash/components/ui/AliasModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useTable } from '@/context/TableContext';
import { useWeather } from '@/hooks/useWeather';

// Opcionales: loader y error genéricos si quieres mostrarlos dentro del modal
import { CodeValidationLoader } from '@/components/ui/CodeValidationLoader';
import { CodeValidationError } from '@/components/ui/CodeValidationError';

export interface AliasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (alias: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
}

// Genera un alias aleatorio basado en el número de mesa
function generateRandomAlias(tableNumber: string): string {
  const names = ['Foodie', 'Cinéfilo', 'Fan del vermut', 'Comensal', 'Sibarita'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${randomName}_${suffix}`;
}

function AliasModalComponent({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  error,
}: AliasModalProps) {
  const { tableNumber } = useTable();
  const tableNumberString = tableNumber?.toString() || '0';
  const { current, loading: weatherLoading } = useWeather('Pozuelo de Alarcón');

  // Alias inicial memoizado para no regenerar cada render
  const initialGeneratedAlias = useMemo(
    () => generateRandomAlias(tableNumberString),
    [tableNumberString],
  );

  const [alias, setAlias] = useState(initialGeneratedAlias);

  // Reset alias cuando se abra el modal sin alias previo
  useEffect(() => {
    if (isOpen) {
      setAlias(initialGeneratedAlias);
    }
  }, [isOpen, initialGeneratedAlias]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const finalAlias = alias.trim() || generateRandomAlias(tableNumberString);
      const success = await onConfirm(finalAlias);
      if (success) {
        onClose();
      }
    },
    [alias, onConfirm, onClose, tableNumberString],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative max-w-md w-full p-8 bg-white/25 backdrop-blur-md rounded-3xl border border-white/30 shadow-xl text-[#0e1b19] flex flex-col items-center text-center"
            style={{ fontFamily: 'Epilogue, "Noto Sans", sans-serif' }}
          >
            <motion.div
              className="w-40 h-36 mb-4"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            >
              <DotLottieReact
                src="https://lottie.host/cadb6b62-74e5-48a0-8d6a-8eab09e332b5/iiIBNG6xAU.lottie"
                loop
                autoplay
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </motion.div>

            <motion.h2
              className="text-[#1ce3cf] text-3xl font-bold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Hazte un hueco en la mesa
            </motion.h2>

            <motion.p
              className="text-white text-lg mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Añade tu nombre o alias para que el staff sepa a quién servir 😋
            </motion.p>

            {error && (
              <CodeValidationError
                message={error}
                onRetry={() => {
                  /* opcional: reenfocar input */
                }}
              />
            )}

            <motion.form
              onSubmit={handleSubmit}
              className="w-full space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Tu nombre o alias (opcional)"
                className="w-full px-5 py-4 text-white bg-white/10 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1ce3cf] placeholder-white/50 text-lg"
                disabled={isLoading}
              />

              <motion.button
                type="submit"
                className="w-full py-4 px-5 bg-[#1ce3cf] text-[#0e1b19] text-lg font-bold rounded-xl flex items-center justify-center space-x-2 active:bg-[#19cfc0]"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                <span>{isLoading ? 'Guardando...' : 'Entrar en la mesa'}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </motion.button>
            </motion.form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const AliasModal = React.memo(AliasModalComponent);
