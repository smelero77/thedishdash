import { useState } from 'react';
import type { Modifier } from '@/types/modifiers';
import type { ModifierOption } from '@/types/modifiers';
import type { SupabaseMenuItem } from '@/types/menu';
import { supabase } from '@/lib/supabase';

export function useModifiers() {
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchModifiers = async (menuItemId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('modifiers')
        .select(
          `
          *,
          options:modifier_options(
            *,
            allergens:modifier_options_allergens(
              allergen:allergens(*)
            )
          )
        `,
        )
        .eq('menu_item_id', menuItemId);

      if (error) throw error;

      const processed: Modifier[] = (data || []).map((raw: any) => ({
        id: raw.id,
        name: raw.name,
        description: raw.description,
        required: raw.required,
        multi_select: raw.multi_select,
        options: raw.options.map(
          (opt: any): ModifierOption => ({
            id: opt.id,
            name: opt.name,
            extra_price: opt.extra_price,
            is_default: opt.is_default,
            icon_url: opt.icon_url ?? undefined,
            related_menu_item_id: opt.related_menu_item_id ?? undefined,
            allergens:
              opt.allergens?.map((a: any) => ({
                id: a.allergen.id,
                name: a.allergen.name,
                icon_url: a.allergen.icon_url ?? '',
              })) ?? [],
          }),
        ),
      }));

      setModifiers(processed);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar los modificadores'));
    } finally {
      setLoading(false);
    }
  };

  return {
    modifiers,
    loading,
    error,
    fetchModifiers,
  };
}
