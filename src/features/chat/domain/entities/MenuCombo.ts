import { MenuItem } from './MenuItem';

export interface MenuCombo {
  id: string;
  mainItem: MenuItem;
  suggestedItems: MenuItem[];
  totalPrice: number;
} 