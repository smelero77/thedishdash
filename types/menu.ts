import { 
  Modifier, 
  SelectedModifiers, 
  Allergen, 
  MenuItemAllergen,
  SupabaseModifier 
} from './modifiers';

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
  similarity?: number;
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