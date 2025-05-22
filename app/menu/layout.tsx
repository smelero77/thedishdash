'use client';

import { useEffect, useRef, useState } from 'react';
import { CartProvider } from '@/context/CartProvider';
import Providers from '@/components/Providers';
import { Toaster } from '@/components/ui/Toaster';
import { TableProvider } from '@/context/TableContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { getMenuItems, getCurrentSlot } from '@/lib/data';
import type { MenuItemData } from '@/types/menu';
import { processMenuItem } from '@/utils/menu';
// import { FullscreenWrapper } from '@/components/FullscreenWrapper';

// Cache para los slots
let slotsCache: any[] | null = null;

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Cargar slots solo si no están en caché
        if (!slotsCache) {
          slotsCache = await getCurrentSlot();
        }

        // Cargar items del menú
        const items = await getMenuItems();
        const processedItems = items.map(processMenuItem);
        setMenuItems(processedItems);
      } catch (error) {
        console.error('Error loading menu data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <Providers menuItems={menuItems}>
      <CustomerProvider>
        <TableProvider>
          <CartProvider menuItems={menuItems}>
            {/* <FullscreenWrapper> */}
            <div className="flex flex-col">{children}</div>
            <Toaster />
            {/* </FullscreenWrapper> */}
          </CartProvider>
        </TableProvider>
      </CustomerProvider>
    </Providers>
  );
}
