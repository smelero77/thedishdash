import { useState, useEffect, useMemo } from 'react';
import type { Category, MenuItemData, Slot, SupabaseMenuItem } from '@/types/menu';
import { supabase } from '@/lib/supabase';
import { getCurrentSlot } from '@/utils/slot';
import { processMenuItem } from '@/utils/menu';

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
          .select(
            `
            *,
            slot_categories (
              slot_id
            )
          `,
          )
          .order('sort_order');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch menu items
        const { data: menuItemsData, error: menuItemsError } = await supabase.from('menu_items')
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

  const menuItems = useMemo<MenuItemData[]>(
    () => rawMenuItems.map((r: SupabaseMenuItem) => processMenuItem(r)),
    [rawMenuItems],
  );

  const categoriesWithItems = useMemo<CategoryWithItems[]>(
    () =>
      categories.map((cat: Category) => ({
        ...cat,
        items: menuItems.filter((item: MenuItemData) => item.category_ids.includes(cat.id)),
      })),
    [categories, menuItems],
  );

  return {
    slots,
    currentSlot,
    categories: categoriesWithItems,
    menuItems,
    loading,
    error,
  };
};
