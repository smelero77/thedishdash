export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  food_info: string | null;
  origin: string | null;
  pairing_suggestion: string | null;
  chef_notes?: string;
  is_recommended?: boolean;
  is_available: boolean;
  profit_margin?: number;
  category_ids?: string[];
  ingredients?: string[];
  allergens?: string[];
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