import { Allergen, MenuItemAllergen } from './menu';

export interface ModifierOption {
  id: string;
  name: string;
  extra_price: number;
  is_default: boolean;
  icon_url: string | undefined;
  related_menu_item_id: string | undefined;
  allergens: MenuItemAllergen[];
}

export interface Modifier {
  id: string;
  name: string;
  description: string;
  required: boolean;
  multi_select: boolean;
  options: ModifierOption[];
}

export interface ModifierSelection {
  name: string;
  options: {
    id: string;
    name: string;
    extra_price: number;
  }[];
}

export interface SelectedModifiers {
  [modifierId: string]: string[]; // Array de IDs de opciones seleccionadas
} 