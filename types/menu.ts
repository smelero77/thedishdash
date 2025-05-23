import { Modifier, ModifierOption } from './modifiers';

export interface SupabaseModifier {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  multi_select: boolean;
  modifier_options: {
    id: string;
    name: string;
    extra_price: number;
    is_default: boolean;
    icon_url: string | null;
    related_menu_item_id: string | null;
    modifier_options_allergens: {
      allergens: {
        id: string;
        name: string;
        icon_url: string | null;
      };
    }[];
  }[];
}

export interface SupabaseMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_recommended: boolean;
  profit_margin: number | null;
  category_ids: string[] | null;
  food_info: string | null;
  origin: string | null;
  pairing_suggestion: string | null;
  chef_notes: string | null;
  menu_item_diet_tags: MenuItemDietTag[];
  menu_item_allergens: {
    allergens: Allergen;
  }[];
  modifiers: SupabaseModifier[];
}

export interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_ids: string[];
  allergens: MenuItemAllergen[];
  modifiers: Modifier[];
  is_recommended: boolean;
  profit_margin: number;
  diet_tags: string[];
  food_info: string;
  origin: string;
  pairing_suggestion: string;
  chef_notes: string;
}

export interface MenuItemAllergen {
  id: string;
  name: string;
  icon_url: string;
}

export interface Allergen {
  id: string;
  name: string;
  icon_url: string;
}

export interface DietTag {
  id: string;
  name: string;
}

export interface MenuItemDietTag {
  diet_tags: DietTag;
}

export interface Slot {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface SlotCategory {
  slot_id: string;
  category_id: string;
}

export interface Category {
  id: string;
  name: string;
  image_url: string;
}

export interface Cart {
  [key: string]: CartItem;
}

export interface CartItem {
  id: string;
  quantity: number;
  modifiers: Record<string, {
    name: string;
    options: {
      id: string;
      name: string;
      extra_price: number;
    }[];
  }>;
  item: MenuItemData;
  client_alias?: string;
} 