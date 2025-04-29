// components/Providers.tsx
'use client';

import '../config/whyDidYouRender';
import React from 'react';
// import { CartProvider } from '@/context/CartContext';
import { TableProvider } from '@/context/TableContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { SplitCartProvider } from '@/context/SplitCartProvider';
import type { MenuItemData } from '@/types/menu';

interface ProvidersProps {
  children: React.ReactNode;
  menuItems: MenuItemData[] | null;
}

export default function Providers({ children, menuItems }: ProvidersProps) {
  return (
    <TableProvider>
      <CustomerProvider>
        <SplitCartProvider menuItems={menuItems}>
          {children}
        </SplitCartProvider>
      </CustomerProvider>
    </TableProvider>
  );
}
