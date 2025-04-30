import type { Category, MenuItemData, Slot, SupabaseMenuItem, MenuItemAllergen, Modifier, ModifierOption } from '@/types/menu';

export interface CategoryWithItems {
    category: Category;
    items: MenuItemData[];
}

/**
 * Determina el Slot activo basado en la hora actual y una lista de slots.
 * @param slots Array de objetos Slot disponibles.
 * @param currentDate Objeto Date que representa la hora actual (o la hora a comprobar).
 * @returns El objeto Slot activo o null si ninguno está activo.
 */
export function getCurrentSlot(slots: Slot[], currentDate: Date = new Date()): Slot | null {
    if (!slots || slots.length === 0) {
        return null; // No hay slots para comprobar
    }

    // Considera la zona horaria relevante si es necesario. Este ejemplo usa la hora local del servidor.
    const currentTimeInMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

    const activeSlot = slots.find(slot => {
        const [startHour, startMinute] = slot.start_time.split(':').map(Number);
        const [endHour, endMinute] = slot.end_time.split(':').map(Number);
        let slotStartMinutes = startHour * 60 + startMinute;
        let slotEndMinutes = endHour * 60 + endMinute;

        // Validación básica por si los tiempos son inválidos en la DB
        if (isNaN(slotStartMinutes) || isNaN(slotEndMinutes)) {
            console.warn(`[getCurrentSlot] Slot con ID ${slot.id} ('${slot.name}') tiene tiempos inválidos: ${slot.start_time} - ${slot.end_time}`);
            return false;
        }

        // Manejo de slots que cruzan medianoche (e.g., 22:00 a 02:00)
        if (slotEndMinutes < slotStartMinutes) {
            // La hora actual es después del inicio (hoy) O antes del fin (mañana)
            return currentTimeInMinutes >= slotStartMinutes || currentTimeInMinutes < slotEndMinutes;
        } else {
            // Horario normal dentro del mismo día
            return currentTimeInMinutes >= slotStartMinutes && currentTimeInMinutes < slotEndMinutes;
        }
    });

    return activeSlot || null; // Devuelve el slot encontrado o null
}

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