// Tipos base
export interface Allergen {
  id: string;
  name: string;
  icon_url: string;
}

export interface MenuItemAllergen extends Allergen {
  is_visible: boolean;
}

// Tipo base para opciones de modificador
export interface ModifierOption {
  id: string;
  name: string;
  extra_price: number;
  is_default: boolean;
  icon_url: string | null;
  related_menu_item_id: string | null;
  allergens: MenuItemAllergen[];
}

// Tipo base para modificador
export interface Modifier {
  id: string;
  name: string;
  description: string;
  required: boolean;
  multi_select: boolean;
  options: ModifierOption[];
}

// Tipo para selección de modificador en el carrito
export interface ModifierSelection {
  name: string;
  options: {
    id: string;
    name: string;
    extra_price: number;
  }[];
}

// Tipo para modificadores seleccionados
export interface SelectedModifiers {
  [modifierId: string]: {
    id: string;
    name: string;
    options: Array<{
      id: string;
      name: string;
      extra_price: number;
    }>;
  };
}

// Tipo para modificadores de Supabase
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
