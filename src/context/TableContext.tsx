'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TableContextType {
  tableNumber: string | null;
  setTableNumber: (tableNumber: string) => void;
}

const TableContext = createContext<TableContextType>({
  tableNumber: null,
  setTableNumber: () => {},
});

export const useTable = () => useContext(TableContext);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tableNumber, setTableNumber] = useState<string | null>(null);

  useEffect(() => {
    // Intentar recuperar el número de mesa del localStorage
    const storedTableNumber = localStorage.getItem('tableNumber');
    if (storedTableNumber) {
      setTableNumber(storedTableNumber);
    }
  }, []);

  const handleSetTableNumber = (newTableNumber: string) => {
    setTableNumber(newTableNumber);
    localStorage.setItem('tableNumber', newTableNumber);
  };

  return (
    <TableContext.Provider
      value={{
        tableNumber,
        setTableNumber: handleSetTableNumber,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}; 