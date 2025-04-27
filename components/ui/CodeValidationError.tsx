"use client"

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';
import { useRouter } from 'next/navigation';

interface CodeValidationErrorProps {
  error: string;
  onRetry?: () => void;
}

export function CodeValidationError({ 
  error,
  onRetry 
}: CodeValidationErrorProps) {
  const router = useRouter();

  return (
    <motion.div
      className="w-full max-w-md bg-white/90 rounded-xl p-6 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-[#0e1b19] text-center">
          Código no válido
        </h3>
        <p className="text-gray-600 text-center text-sm">
          {error}
        </p>
        <div className="flex gap-2 pt-2 w-full">
          {onRetry && (
            <Button 
              className="w-full h-10 rounded-full bg-gray-200 text-[#0e1b19] hover:bg-gray-300"
              onClick={onRetry}
            >
              Reintentar
            </Button>
          )}
          <Button 
            className="w-full h-10 rounded-full bg-[#1ce3cf] text-[#0e1b19] hover:bg-[#1ce3cf]/90"
            onClick={() => router.push('/')}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 