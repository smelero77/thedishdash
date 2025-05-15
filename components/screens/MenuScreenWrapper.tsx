'use client';

import { CartProvider } from '@/context/CartProvider';
import MenuScreen from './MenuScreen';
import type { MenuItemData, Slot } from '@/types/menu';
import type { CategoryWithItems } from '@/lib/utils';

interface MenuScreenWrapperProps {
  initialSlots: Slot[];
  initialCategories: CategoryWithItems[];
  initialMenuItems: MenuItemData[];
  initialCurrentSlot: Slot | null;
  mainCategoryId: string | null;
}

export const MenuScreenWrapper: React.FC<MenuScreenWrapperProps> = (props) => {
  return (
    <CartProvider menuItems={props.initialMenuItems}>
      <MenuScreen {...props} />
    </CartProvider>
  );
}; 