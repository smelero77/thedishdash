import { Modifier } from './modifiers';

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
  description: string | null;
  price: number;
  image_url: string | null;
  category_ids: string[];
  allergens: Allergen[];
  diet_tags: string[];
  food_info: string | null;
  origin: string | null;
  pairing_suggestion: string | null;
  chef_notes: string | null;
  is_available: boolean;
  is_recommended: boolean;
  profit_margin: number | null;
  modifiers: Modifier[];
  ingredients?: string[];
  created_at?: string;
  updated_at?: string;
  menu_item_diet_tags?: MenuItemDietTag[];
  menu_item_allergens?: {
    allergens: Allergen;
  }[];
}

export interface Allergen {
  id: string;
  name: string;
  icon_url: string;
}

export interface MenuItemAllergen extends Allergen {
  is_visible: boolean;
}

export interface DietTag {
  id: string;
  name: string;
}

export interface MenuItemDietTag {
  diet_tags: DietTag;
}

export interface Modifier {
  id: string;
  name: string;
  description: string;
  required: boolean;
  multi_select: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  extra_price: number;
  is_default: boolean;
  icon_url?: string;
  related_menu_item_id?: string;
  allergens: Allergen[];
}

export interface Slot {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  is_active?: boolean;
}

export interface SlotCategory {
  slot_id: string;
  category_id: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url: string | null;
  sort_order: number;
  is_complementary: boolean;
  slot_categories?: Array<{
    slot_id: string;
  }>;
  order?: number;
  slot_id?: string;
}

export interface CategoryWithItems extends Category {
  items: MenuItemData[];
}

export interface CartItem {
  id: string;
  item: MenuItemData;
  quantity: number;
  client_alias?: string;
  modifiers?: SelectedModifiers;
}

export interface Cart {
  [key: string]: CartItem;
}

export interface SelectedModifiers {
  [key: string]: {
    id: string;
    name: string;
    options: Array<{
      id: string;
      name: string;
    }>;
  };
} 