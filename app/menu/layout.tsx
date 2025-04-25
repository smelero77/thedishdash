'use client';

import React from 'react';
import { CustomerProvider } from '@/context/CustomerContext';
import { TableProvider } from '@/context/TableContext';

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerProvider>
      <TableProvider>
        {children}
      </TableProvider>
    </CustomerProvider>
  );
} 