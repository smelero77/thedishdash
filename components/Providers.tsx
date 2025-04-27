'use client';

import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { TableProvider } from '@/context/TableContext';
import { CustomerProvider } from '@/context/CustomerContext';
import type { MenuItemData } from '@/types/menu';

interface ProvidersProps {
  children: React.ReactNode;
  menuItems: MenuItemData[];
}

export default function Providers({ children, menuItems }: ProvidersProps) {
  return (
    <CartProvider
      menuItems={menuItems}
      slotId=""
      alias="guest" // Se actualizará en el cliente
      tableCode="" // Se actualizará en el cliente
    >
      <TableProvider>
        <CustomerProvider>
          {children}
        </CustomerProvider>
      </TableProvider>
    </CartProvider>
  );
} 