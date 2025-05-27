'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Preparando tu experiencia culinaria...',
}) => {
  // Definimos diferentes patrones de altura para cada barra
  const barPatterns = [
    [10, 60, 10, 30, 10], // Sube alto, baja medio
    [10, 30, 10, 60, 10], // Sube medio, baja alto
    [10, 50, 10, 20, 10], // Sube alto, baja bajo
    [10, 20, 10, 50, 10], // Sube bajo, baja alto
    [10, 40, 10, 40, 10], // Sube y baja igual
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fbfb]">
      <div className="flex flex-col items-center gap-6">
        {/* Visualizador tipo ecualizador */}
        <div className="flex items-end gap-1 h-20">
          {barPatterns.map((pattern, i) => (
            <motion.div
              key={i}
              className="w-3 rounded-t-sm"
              initial={{ height: 10, backgroundColor: '#e5e7eb' }}
              animate={{
                height: pattern,
                backgroundColor: pattern.map((_, index) =>
                  index % 2 === 0 ? '#e5e7eb' : '#4f968f',
                ),
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Texto */}
        <div className="flex flex-col items-center">
          <motion.div
            className="text-xl font-semibold text-[#4f968f] text-center max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {message}
          </motion.div>
          <motion.div
            className="text-sm text-[#4f968f]/70 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Un momento, estamos preparando algo especial...
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
