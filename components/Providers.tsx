// components/Providers.tsx
'use client';

import '../config/whyDidYouRender';
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
    <TableProvider>
      <CartProvider menuItems={menuItems} slotId="" alias="guest" tableCode="">
        <CustomerProvider>{children}</CustomerProvider>
      </CartProvider>
    </TableProvider>
  );
}
