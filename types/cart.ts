import { MenuItemData } from './menu';
import { ModifierSelection } from './modifiers';

export interface CartItem {
  id: string;
  quantity: number;
  modifiers: Record<string, ModifierSelection>;
  item: MenuItemData;
  client_alias?: string;
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