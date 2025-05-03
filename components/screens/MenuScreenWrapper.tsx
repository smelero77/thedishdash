'use client';

import { CartProvider } from '@/context/CartProvider';
import MenuScreen from './MenuScreen';
import type { MenuItemData, CategoryWithItems, Slot } from '@/types/menu';

interface MenuScreenWrapperProps {
  initialSlots: Slot[];
  initialCategories: CategoryWithItems[];
  initialMenuItems: MenuItemData[];
  initialCurrentSlot: Slot | null;
}

export const MenuScreenWrapper: React.FC<MenuScreenWrapperProps> = (props) => {
  return (
    <CartProvider menuItems={props.initialMenuItems}>
      <MenuScreen {...props} />
    </CartProvider>
  );
}; 