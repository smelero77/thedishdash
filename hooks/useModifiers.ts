import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Modifier, SupabaseMenuItem } from '@/types/menu';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const useModifiers = () => {
  const [modifiers, setModifiers] = useState<Modifier[]>([]);

  const fetchModifiers = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          id,
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

      if (error) throw error;

      if (data) {
        const item = data as unknown as SupabaseMenuItem;
        const processed = item.modifiers?.map(mod => {
          // Obtener los IDs de los items relacionados
          const relatedItemIds = mod.modifier_options
            .map(opt => opt.related_menu_item_id)
            .filter(id => id !== null) as string[];

          // Consultar el estado de disponibilidad de los items relacionados
          const checkAvailability = async () => {
            if (relatedItemIds.length === 0) return {};
            const { data: availableItems } = await supabase
              .from('menu_items')
              .select('id, is_available')
              .in('id', relatedItemIds);
            
            return (availableItems || []).reduce((acc: Record<string, boolean>, item: any) => {
              acc[item.id] = item.is_available;
              return acc;
            }, {});
          };

          // Filtrar las opciones basadas en la disponibilidad
          return checkAvailability().then(availabilityMap => ({
            id: mod.id,
            name: mod.name,
            description: mod.description || '',
            required: mod.required,
            multi_select: mod.multi_select,
            options: mod.modifier_options.filter(opt => 
              !opt.related_menu_item_id || availabilityMap[opt.related_menu_item_id]
            ).map((opt: any) => ({
              id: opt.id,
              name: opt.name,
              extra_price: opt.extra_price,
              is_default: opt.is_default,
              icon_url: opt.icon_url ?? '',
              related_menu_item_id: opt.related_menu_item_id || undefined,
              allergens: opt.modifier_options_allergens?.map((a: any) => ({
                id: a.allergens.id,
                name: a.allergens.name,
                icon_url: a.allergens.icon_url ?? ''
              })) ?? []
            }))
          }));
        }) || [];

        Promise.all(processed).then(setModifiers);
      }
    } catch (error) {
      console.error('Error fetching modifiers:', error);
    }
  };

  return { modifiers, setModifiers, fetchModifiers };
}; 