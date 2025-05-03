import { useState, useEffect, useMemo } from 'react';
import type { Category, MenuItemData, Slot, SupabaseMenuItem } from '@/types/menu';
import { supabase } from '@/lib/supabase';
import { useCurrentSlot } from './useCurrentSlot';
import { getCurrentSlot } from '@/lib/utils';

/**
 * Transforma un registro crudo de Supabase a la forma interna MenuItemData
 */
export function processMenuItem(raw: SupabaseMenuItem): MenuItemData {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    price: raw.price,
    image_url: raw.image_url ?? '',
    category_ids: raw.category_ids ?? [],
    allergens: raw.menu_item_allergens.map(a => ({
      id: a.allergens.id,
      name: a.allergens.name,
      icon_url: a.allergens.icon_url ?? ''
    })),
    diet_tags: raw.menu_item_diet_tags.map(dt => dt.diet_tags.name),
    food_info: raw.food_info ?? '',
    origin: raw.origin ?? '',
    pairing_suggestion: raw.pairing_suggestion ?? '',
    chef_notes: raw.chef_notes ?? '',
    is_recommended: raw.is_recommended,
    profit_margin: raw.profit_margin ?? 0,
    modifiers: raw.modifiers.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description ?? '',
      required: m.required,
      multi_select: m.multi_select,
      options: m.modifier_options.map(opt => ({
        id: opt.id,
        name: opt.name,
        extra_price: opt.extra_price,
        is_default: opt.is_default,
        icon_url: opt.icon_url ?? undefined,
        related_menu_item_id: opt.related_menu_item_id ?? undefined,
        allergens: opt.modifier_options_allergens.map(ma => ({
          id: ma.allergens.id,
          name: ma.allergens.name,
          icon_url: ma.allergens.icon_url ?? ''
        }))
      }))
    }))
  };
}

export interface CategoryWithItems extends Category {
  items: MenuItemData[];
}

interface UseMenuDataResult {
  slots: Slot[];
  currentSlot: Slot | null;
  categories: CategoryWithItems[];
  menuItems: MenuItemData[];
  loading: boolean;
  error: Error | null;
}

export const useMenuData = (): UseMenuDataResult => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [currentSlot, setCurrentSlot] = useState<Slot | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rawMenuItems, setRawMenuItems] = useState<SupabaseMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch slots
        const { data: slotsData, error: slotsError } = await supabase
          .from('slots')
          .select('*')
          .order('start_time');

        if (slotsError) throw slotsError;
        setSlots(slotsData || []);

        // Fetch categories with slot relationships
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select(`
            *,
            slot_categories (
              slot_id
            )
          `)
          .order('sort_order');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch menu items
        const { data: menuItemsData, error: menuItemsError } = await supabase
          .from('menu_items')
          .select(`
            *,
            menu_item_allergens (
              allergens (id,name,icon_url)
            ),
            menu_item_diet_tags (
              diet_tags (id,name)
            ),
            modifiers (
              id,name,description,required,multi_select,
              modifier_options (
                id,name,extra_price,is_default,icon_url,related_menu_item_id,
                modifier_options_allergens (
                  allergens (id,name,icon_url)
                )
              )
            )
          `);

        if (menuItemsError) throw menuItemsError;
        setRawMenuItems(menuItemsData || []);

        // Set current slot
        const activeSlot = getCurrentSlot(slotsData || []);
        setCurrentSlot(activeSlot);

      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const menuItems = useMemo<MenuItemData[]>(() =>
    rawMenuItems.map(r => processMenuItem(r)),
  [rawMenuItems]);

  const categoriesWithItems = useMemo<CategoryWithItems[]>(() =>
    categories.map(cat => ({
      ...cat,
      items: menuItems.filter(item =>
        item.category_ids.includes(cat.id)
      )
    })),
  [categories, menuItems]);

  return {
    slots,
    currentSlot,
    categories: categoriesWithItems,
    menuItems,
    loading,
    error
  };
};
