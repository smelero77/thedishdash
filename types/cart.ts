import { MenuItemData } from './menu';
import { SelectedModifiers } from './modifiers';

export interface CartItem {
  id: string;
  quantity: number;
  modifiers: Record<string, SelectedModifiers>;
  item: MenuItemData;
  client_alias?: string;
  menu_item_id?: string;
  alias?: string;
  price?: number;
}

export interface Cart {
  [key: string]: CartItem;
}

export interface CartTotal {
  subtotal: number;
  tax: number;
  total: number;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  total: number;
}

export interface ClientCartSummary {
  [alias: string]: CartSummary;
}

export interface CartActions {
  handleAddToCart: (itemId: string, modifiers?: SelectedModifiers | null) => Promise<void>;
  handleDecrementCart: (itemId: string, modifiers?: SelectedModifiers | null) => Promise<void>;
  getTotalItems: () => number;
  getItemQuantity: (itemId: string) => number;
} 