// components/Providers.tsx
'use client';

if (process.env.NODE_ENV === 'development') {
  import('../config/whyDidYouRender').then(({ initWhyDidYouRender }) => {
    initWhyDidYouRender();
  });
}

import React from 'react';
// import { CartProvider } from '@/context/CartContext';
import { TableProvider } from '@/context/TableContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { CartProvider } from '@/context/CartProvider';
import type { MenuItemData } from '@/types/menu';

interface ProvidersProps {
  children: React.ReactNode;
  menuItems: MenuItemData[] | null;
}

export default function Providers({ children, menuItems }: ProvidersProps) {
  return (
    <TableProvider>
      <CustomerProvider>
        <CartProvider menuItems={menuItems}>{children}</CartProvider>
      </CustomerProvider>
    </TableProvider>
  );
}
