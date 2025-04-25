import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TableContextType {
  tableNumber: number;
  setTableNumber: (tableNumber: number) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tableNumber, setTableNumber] = useState<number>(0);

  return (
    <TableContext.Provider value={{ tableNumber, setTableNumber }}>
      {children}
    </TableContext.Provider>
  );
};

export const useTable = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
}; 