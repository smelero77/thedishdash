import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Category, Slot, MenuItemData, SupabaseMenuItem } from '@/types/menu';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const useMenuData = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [currentSlot, setCurrentSlot] = useState<Slot | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data, error } = await supabase
          .from('slots')
          .select('*')
          .order('start_time');

        if (error) throw error;
        if (data) setSlots(data);

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const currentSlot = data?.find(slot => {
          const [startHour, startMinute] = slot.start_time.split(':').map(Number);
          const [endHour, endMinute] = slot.end_time.split(':').map(Number);
          const slotStart = startHour * 60 + startMinute;
          const slotEnd = endHour * 60 + endMinute;
          return currentTime >= slotStart && currentTime < slotEnd;
        });

        setCurrentSlot(currentSlot || null);
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError('Error fetching slots');
      }
    };

    fetchSlots();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select(`
            *,
            slot_categories (
              slot_id
            )
          `);

        if (error) throw error;

        if (data) {
          const sortedCategories = data.sort((a, b) => {
            if (a.is_complementary && !b.is_complementary) return 1;
            if (!a.is_complementary && b.is_complementary) return -1;

            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();

            const isInCurrentSlot = (category: typeof a) => {
              return slots.some(slot => {
                const [startHour, startMinute] = slot.start_time.split(':').map(Number);
                const [endHour, endMinute] = slot.end_time.split(':').map(Number);
                const start = startHour * 60 + startMinute;
                const end = endHour * 60 + endMinute;
                const inSlot = currentTime >= start && currentTime < end;
                return inSlot && category.slot_categories?.some((sc: { slot_id: string }) => sc.slot_id === slot.id);
              });
            };

            const getClosestSlotMinutes = (category: typeof a) => {
              const distances = slots
                .filter(slot => category.slot_categories?.some((sc: { slot_id: string }) => sc.slot_id === slot.id))
                .map(slot => {
                  const [startHour, startMinute] = slot.start_time.split(':').map(Number);
                  const start = startHour * 60 + startMinute;

                  if (start < currentTime) {
                    return 100000;
                  }

                  return start - currentTime;
                });

              return distances.length ? Math.min(...distances) : 999999;
            };

            const aInCurrentSlot = isInCurrentSlot(a);
            const bInCurrentSlot = isInCurrentSlot(b);
            if (aInCurrentSlot && !bInCurrentSlot) return -1;
            if (!aInCurrentSlot && bInCurrentSlot) return 1;

            const aDistance = getClosestSlotMinutes(a);
            const bDistance = getClosestSlotMinutes(b);
            if (aDistance !== bDistance) return aDistance - bDistance;

            return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
          });

          setCategories(sortedCategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Error fetching categories');
      }
    };

    if (slots.length > 0) {
      fetchCategories();
    }
  }, [slots]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const { data: menuItemsData, error: menuItemsError } = await supabase
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
          .order('name');

        if (menuItemsError) throw menuItemsError;

        if (menuItemsData) {
          const formattedItems: MenuItemData[] = (menuItemsData as unknown as SupabaseMenuItem[]).map(processMenuItem);
          setMenuItems(formattedItems);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('Error fetching menu items');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const processMenuItem = (item: SupabaseMenuItem): MenuItemData => {
    return {
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || '',
      allergens: item.menu_item_allergens.map((a: any) => ({
        id: a.allergens.id,
        name: a.allergens.name,
        icon_url: a.allergens.icon_url || ''
      })),
      modifiers: item.modifiers.map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        required: m.required,
        multi_select: m.multi_select,
        options: m.modifier_options.map((o: any) => ({
          id: o.id,
          name: o.name,
          extra_price: o.extra_price,
          is_default: o.is_default,
          icon_url: o.icon_url || undefined,
          related_menu_item_id: o.related_menu_item_id || undefined,
          allergens: o.modifier_options_allergens.map((a: any) => ({
            id: a.allergens.id,
            name: a.allergens.name,
            icon_url: a.allergens.icon_url || undefined
          }))
        }))
      })),
      category_ids: item.category_ids || [],
      is_recommended: item.is_recommended,
      profit_margin: item.profit_margin || 0,
      diet_tags: item.menu_item_diet_tags.map((d: any) => d.diet_tags.name),
      food_info: item.food_info || '',
      origin: item.origin || '',
      pairing_suggestion: item.pairing_suggestion || '',
      chef_notes: item.chef_notes || ''
    };
  };

  return {
    slots,
    currentSlot,
    categories,
    menuItems,
    loading,
    error
  };
};

export default useMenuData; 