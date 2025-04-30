export interface Category {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    order: number;
    slot_id: string;
}

export interface MenuItemData {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category_ids: string[];
    allergens: Allergen[];
    diet_tags: string[];
    food_info: string;
    origin: string;
    pairing_suggestion: string;
    chef_notes: string;
    is_available: boolean;
    is_recommended: boolean;
    profit_margin: number;
    modifiers: Modifier[];
}

export interface SupabaseMenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    category_ids: string[] | null;
    menu_item_allergens: Array<{
        allergens: {
            id: string;
            name: string;
            icon_url: string | null;
        };
    }>;
    menu_item_diet_tags: Array<{
        diet_tags: {
            name: string;
        };
    }>;
    food_info: string | null;
    origin: string | null;
    pairing_suggestion: string | null;
    chef_notes: string | null;
    is_available: boolean | null;
    is_recommended: boolean | null;
    profit_margin: number | null;
    modifiers: Array<{
        id: string;
        name: string;
        description: string | null;
        required: boolean;
        multi_select: boolean;
        modifier_options: Array<{
            id: string;
            name: string;
            extra_price: number;
            is_default: boolean;
            icon_url: string | null;
            related_menu_item_id: string | null;
            modifier_options_allergens: Array<{
                allergens: {
                    id: string;
                    name: string;
                    icon_url: string | null;
                };
            }>;
        }>;
    }>;
}

export interface Allergen {
    id: string;
    name: string;
    icon_url: string;
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
    is_active: boolean;
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

export interface MenuItemAllergen extends Allergen {
    is_visible: boolean;
} 