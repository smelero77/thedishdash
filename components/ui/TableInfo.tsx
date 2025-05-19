'use client';

import { motion } from 'framer-motion';
import { InfoIcon } from 'lucide-react';

interface TableInfoProps {
  tableNumber: number;
}

export function TableInfo({ tableNumber }: TableInfoProps) {
  return (
    <motion.div
      className="flex items-center justify-center gap-2 bg-[#e8f3f2] p-3 px-4 rounded-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <InfoIcon className="w-4 h-4 text-[#0e1b19]" />
      <p className="text-[#0e1b19] text-sm font-medium">Mesa {tableNumber}</p>
    </motion.div>
  );
}
