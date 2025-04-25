import { MenuItemData, Cart } from '@/types/menu';

interface CartModalProps {
  items: Cart;
  menuItems: MenuItemData[];
  onClose: () => void;
  onAddToCart: (itemId: string, modifiers?: Record<string, any>) => void;
  onRemoveFromCart: (itemId: string, modifiers: Record<string, any>, price: number) => void;
  currentClientAlias?: string;
} 