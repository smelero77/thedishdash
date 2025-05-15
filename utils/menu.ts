import type { MenuItemData, SupabaseMenuItem, MenuItemAllergen } from '@/types/menu';

/**
 * Transforma un registro crudo de Supabase (SupabaseMenuItem)
 * a la estructura de datos interna de la aplicación (MenuItemData).
 */
export function processMenuItem(item: SupabaseMenuItem): MenuItemData {
    return {
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        image_url: item.image_url || '',
        category_ids: item.category_ids || [],
        allergens: item.menu_item_allergens.map(ma => ({
            id: ma.allergens.id,
            name: ma.allergens.name,
            icon_url: ma.allergens.icon_url || '',
            is_visible: true
        })) as MenuItemAllergen[],
        diet_tags: item.menu_item_diet_tags.map(dt => dt.diet_tags.name),
        food_info: item.food_info || '',
        origin: item.origin || '',
        pairing_suggestion: item.pairing_suggestion || '',
        chef_notes: item.chef_notes || '',
        is_available: item.is_available || false,
        is_recommended: item.is_recommended || false,
        profit_margin: item.profit_margin || 0,
        modifiers: item.modifiers.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description || '',
            required: m.required,
            multi_select: m.multi_select,
            options: m.modifier_options.map(opt => ({
                id: opt.id,
                name: opt.name,
                extra_price: opt.extra_price,
                is_default: opt.is_default,
                icon_url: opt.icon_url || '',
                related_menu_item_id: opt.related_menu_item_id || '',
                allergens: opt.modifier_options_allergens.map(ma => ({
                    id: ma.allergens.id,
                    name: ma.allergens.name,
                    icon_url: ma.allergens.icon_url || ''
                }))
            }))
        }))
    };
} 