'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface TableContextType {
  tableNumber: number;
  setTableNumber: (number: number) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export function TableProvider({ children }: { children: ReactNode }) {
  const [tableNumber, setTableNumber] = useState<number>(() => {
    // Intentar cargar el número de mesa desde localStorage al inicializar
    if (typeof window !== 'undefined') {
      const storedTableNumber = localStorage.getItem('tableNumber');
      return storedTableNumber ? parseInt(storedTableNumber, 10) : 0;
    }
    return 0;
  });

  // Actualizar localStorage cuando cambie el número de mesa
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tableNumber', tableNumber.toString());
    }
  }, [tableNumber]);

  return (
    <TableContext.Provider value={{ tableNumber, setTableNumber }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
}
