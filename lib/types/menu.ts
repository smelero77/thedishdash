export interface MenuItem {
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
  item_type: 'Comida' | 'Bebida';
  keywords: string[] | null;
  calories_est_min: number | null;
  calories_est_max: number | null;
  drink_size: string | null;
  drink_temperature: string | null;
  drink_alcoholic: boolean | null;
  drink_ice: boolean | null;
  is_vegetarian_base: boolean | null;
  is_vegan_base: boolean | null;
  is_gluten_free_base: boolean | null;
  allergens: {
    id: string;
    name: string;
    icon_url: string | null;
  }[];
  diet_tags: {
    id: string;
    name: string;
  }[];
  modifiers: {
    id: string;
    name: string;
    description: string | null;
    required: boolean;
    multi_select: boolean;
    options: {
      id: string;
      name: string;
      extra_price: number;
      is_default: boolean;
      icon_url: string | null;
      related_menu_item_id: string | null;
      allergens: {
        id: string;
        name: string;
        icon_url: string | null;
      }[];
    }[];
  }[];
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_complementary: boolean;
  image_url: string | null;
}

export interface CartItem {
  id: string;
  menu_item_id: string;
  alias: string;
  quantity: number;
  price: number;
  modifiers: any | null;
}

export interface Session {
  id: string;
  system_context: string;
  menu_items: MenuItem[];
  time_of_day: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender: string;
  content: string;
  created_at: string;
}

export interface ExtractedFilters {
  semanticQueryText: string;
  slotIds?: string[];
  categoryIds?: string[];
  dietTagIdsInclude?: string[];
  allergenIdsExclude?: string[];
  itemType?: 'Comida' | 'Bebida';
  maxCalories?: number;
  isAlcoholic?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  drinkSize?: string;
  drinkTemperature?: string;
  drinkIce?: boolean;
  keywords?: string[];
} 