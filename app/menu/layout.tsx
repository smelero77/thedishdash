import Providers from '@/components/Providers';
import { getMenuItems, getCurrentSlot } from '@/lib/data';
import type { MenuItemData } from '@/types/menu';
import { processMenuItem } from '@/utils/menu';

export default async function MenuLayout({ children }: { children: React.ReactNode }) {
  // ① fetch de datos en el servidor
  const [menuItems, slot] = await Promise.all([
    getMenuItems(),
    getCurrentSlot()
  ]);

  // Convertir los tipos usando la función existente
  const processedMenuItems: MenuItemData[] = menuItems.map(processMenuItem);

  return (
    // ② pasamos los datos como prop
    <Providers menuItems={processedMenuItems}>
      {children}
    </Providers>
  );
} 