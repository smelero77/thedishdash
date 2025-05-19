// lib/data.ts
import { MenuItemData, SupabaseMenuItem, Slot, MenuItemDietTag } from '@/types/menu';
import { supabase } from '@/lib/supabase';

export interface TableData {
  id: string;
  table_number: number;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// ----------------------------------------------------------------
// Lecturas
// ----------------------------------------------------------------

/** Recupera todos los items de menú disponibles */
export async function getMenuItems(): Promise<SupabaseMenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      description,
      price,
      image_url,
      is_available,
      is_recommended,
      profit_margin,
      category_ids,
      food_info,
      origin,
      pairing_suggestion,
      chef_notes,
      menu_item_diet_tags (
        diet_tags (
          id,
          name
        )
      ),
      menu_item_allergens (
        allergens (
          id,
          name,
          icon_url
        )
      ),
      modifiers (
        id,
        name,
        description,
        required,
        multi_select,
        modifier_options (
          id,
          name,
          extra_price,
          is_default,
          icon_url,
          related_menu_item_id,
          modifier_options_allergens (
            allergens (
              id,
              name,
              icon_url
            )
          )
        )
      )
    `)
    .eq('is_available', true)
    .order('is_recommended', { ascending: false })
    .order('profit_margin', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('[lib/data] getMenuItems error:', error);
    return [];
  }

  return (data || []).map(item => ({
    ...item,
    menu_item_diet_tags: (item.menu_item_diet_tags || []).map(tag => ({
      diet_tags: {
        id: tag.diet_tags?.id || '',
        name: tag.diet_tags?.name || ''
      }
    })) as MenuItemDietTag[],
    menu_item_allergens: (item.menu_item_allergens || []).map(allergen => ({
      allergens: {
        id: allergen.allergens?.id || '',
        name: allergen.allergens?.name || '',
        icon_url: allergen.allergens?.icon_url || ''
      }
    })),
    modifiers: item.modifiers || []
  })) as unknown as SupabaseMenuItem[];
}

/** Obtiene múltiples platos por su array de IDs */
export async function getMenuItemsByIds(ids: string[]): Promise<SupabaseMenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      description,
      price,
      image_url,
      is_available,
      is_recommended,
      profit_margin,
      category_ids,
      food_info,
      origin,
      pairing_suggestion,
      chef_notes,
      menu_item_diet_tags (
        diet_tags (
          id,
          name
        )
      ),
      menu_item_allergens (
        allergens (
          id,
          name,
          icon_url
        )
      ),
      modifiers (
        id,
        name,
        description,
        required,
        multi_select,
        modifier_options (
          id,
          name,
          extra_price,
          is_default,
          icon_url,
          related_menu_item_id,
          modifier_options_allergens (
            allergens (
              id,
              name,
              icon_url
            )
          )
        )
      )
    `)
    .in('id', ids)
    .eq('is_available', true);

  if (error) {
    console.error('[lib/data] getMenuItemsByIds error:', error);
    return [];
  }

  return (data || []).map(item => ({
    ...item,
    menu_item_diet_tags: (item.menu_item_diet_tags || []).map(tag => ({
      diet_tags: {
        id: tag.diet_tags?.id || '',
        name: tag.diet_tags?.name || ''
      }
    })) as MenuItemDietTag[],
    menu_item_allergens: (item.menu_item_allergens || []).map(allergen => ({
      allergens: {
        id: allergen.allergens?.id || '',
        name: allergen.allergens?.name || '',
        icon_url: allergen.allergens?.icon_url || ''
      }
    })),
    modifiers: item.modifiers || []
  })) as unknown as SupabaseMenuItem[];
}

/** Recupera todos los slots (franjas horarias) */
export async function getSlots(): Promise<Slot[]> {
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[lib/data] getSlots error:', error);
    return [];
  }
  return data || [];
}

/** Recupera la relación categorías–slots */
export async function getCategoriesWithSlots(): Promise<any[]> {
  const { data, error } = await supabase
    .from('slot_categories')
    .select(`
      *,
      slots (*),
      categories (*)
    `)
    .order('slot_id', { ascending: true });

  if (error) {
    console.error('[lib/data] getCategoriesWithSlots error:', error);
    return [];
  }
  return data || [];
}

/** Recupera el slot actual (puede usarse igual que getSlots) */
export async function getCurrentSlot(): Promise<Slot[]> {
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[lib/data] getCurrentSlot error:', error);
    return [];
  }
  return data || [];
}

/** Recupera todos los códigos de mesa */
export async function getTableCodes(): Promise<{ id: string; table_number: number }[]> {
  const { data, error } = await supabase
    .from('table_codes')
    .select('id, table_number');

  if (error) {
    console.error('[lib/data] getTableCodes error:', error);
    return [];
  }
  return data || [];
}

/** Obtiene un ítem del menú por su ID */
export async function getMenuItemById(itemId: string): Promise<{ menuItem: SupabaseMenuItem | null; error: any }> {
  if (!itemId) {
    return { menuItem: null, error: 'Item ID is required' };
  }

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        is_available,
        is_recommended,
        profit_margin,
        category_ids,
        food_info,
        origin,
        pairing_suggestion,
        chef_notes,
        menu_item_diet_tags (
          diet_tags (
            id,
            name
          )
        ),
        menu_item_allergens (
          allergens (
            id,
            name,
            icon_url
          )
        ),
        modifiers (
          id,
          name,
          description,
          required,
          multi_select,
          modifier_options (
            id,
            name,
            extra_price,
            is_default,
            icon_url,
            related_menu_item_id,
            modifier_options_allergens (
              allergens (
                id,
                name,
                icon_url
              )
            )
          )
        )
      `)
      .eq('id', itemId)
      .single();

    if (error) {
      console.error(`[lib/data] Error fetching menu item ${itemId}:`, error);
      return { menuItem: null, error };
    }

    if (!data) {
      return { menuItem: null, error: 'Menu item not found' };
    }

    const transformedData = {
      ...data,
      menu_item_diet_tags: (data.menu_item_diet_tags || []).map(tag => ({
        diet_tags: {
          id: tag.diet_tags?.id || '',
          name: tag.diet_tags?.name || ''
        }
      })) as MenuItemDietTag[],
      menu_item_allergens: (data.menu_item_allergens || []).map(allergen => ({
        allergens: {
          id: allergen.allergens?.id || '',
          name: allergen.allergens?.name || '',
          icon_url: allergen.allergens?.icon_url || ''
        }
      })),
      modifiers: data.modifiers || []
    };

    return { menuItem: transformedData as unknown as SupabaseMenuItem, error: null };
  } catch (e) {
    console.error(`[lib/data] Exception fetching menu item ${itemId}:`, e);
    return { menuItem: null, error: e };
  }
}

// ----------------------------------------------------------------
// Escrituras / Validaciones
// ----------------------------------------------------------------

/**
 * Valida un código de mesa por número de mesa
 * @param tableNumber Cadena numérica
 */
export async function validateTableCode(tableNumber: string): Promise<{ table: any }> {
  const parsed = parseInt(tableNumber, 10);
  if (isNaN(parsed)) {
    throw new Error('El código de mesa debe ser un número válido');
  }

  const { data: table, error } = await supabase
    .from('table_codes')
    .select('*')
    .eq('table_number', parsed)
    .single();

  if (error || !table) {
    throw new Error('Código de mesa inválido');
  }
  return { table };
}

/**
 * Busca una mesa por su UUID (código)
 * @param code UUID como cadena
 */
export async function getTableByCode(code: string): Promise<ApiResponse<TableData>> {
  try {
    const { data, error } = await supabase
      .from('table_codes')
      .select('*')
      .eq('id', code)
      .single();

    if (error) {
      console.error('[getTableByCode] Error Supabase:', error);
      return { data: null, error };
    }
    if (!data) {
      return { data: null, error: new Error('Mesa no encontrada') };
    }
    return {
      data: {
        id: data.id,
        table_number: data.table_number,
        created_at: data.created_at
      },
      error: null
    };
  } catch (err) {
    console.error('[getTableByCode] Error inesperado:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Error al consultar la mesa')
    };
  }
}
