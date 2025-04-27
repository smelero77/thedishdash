import Providers from '@/components/Providers';
import { getMenuItems, getCurrentSlot } from '@/lib/data';
import type { MenuItemData } from '@/types/menu';

export default async function MenuLayout({ children }: { children: React.ReactNode }) {
  // ① fetch de datos en el servidor
  const [menuItems, slot] = await Promise.all([
    getMenuItems(),
    getCurrentSlot()
  ]);

  // Convertir los tipos
  const processedMenuItems: MenuItemData[] = menuItems.map(item => ({
    ...item,
    description: item.description ?? '',
    allergens: [],
    diet_tags: [],
    food_info: item.food_info ?? '',
    origin: item.origin ?? '',
    pairing_suggestion: item.pairing_suggestion ?? '',
    chef_notes: item.chef_notes ?? '',
    image_url: item.image_url ?? '',
    is_available: item.is_available ?? true,
    is_recommended: item.is_recommended ?? false,
    profit_margin: item.profit_margin ?? 0,
    modifiers: item.modifiers ?? [],
    category_ids: item.category_ids ?? []
  }));

  return (
    // ② pasamos los datos como prop
    <Providers menuItems={processedMenuItems}>
      {children}
    </Providers>
  );
} 