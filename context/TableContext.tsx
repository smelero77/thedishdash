'use client'

import React, { createContext, useContext, ReactNode, useState } from 'react'

interface TableContextType {
  tableNumber: number
  setTableNumber: (number: number) => void
}

const TableContext = createContext<TableContextType | undefined>(undefined)

export function TableProvider({ children }: { children: ReactNode }) {
  const [tableNumber, setTableNumber] = useState<number>(0)

  return (
    <TableContext.Provider value={{ tableNumber, setTableNumber }}>
      {children}
    </TableContext.Provider>
  )
}

export function useTable() {
  const context = useContext(TableContext)
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider')
  }
  return context
} 