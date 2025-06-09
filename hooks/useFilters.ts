import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/menu';

export interface DietTag {
  id: string;
  name: string;
}

export function useFilters() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dietTags, setDietTags] = useState<DietTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFilters() {
      try {
        // Obtener categorías
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, sort_order, image_url, is_complementary')
          .order('sort_order', { ascending: true });

        if (categoriesError) throw categoriesError;

        // Obtener etiquetas dietéticas
        const { data: dietTagsData, error: dietTagsError } = await supabase
          .from('diet_tags')
          .select('id, name')
          .order('name', { ascending: true });

        if (dietTagsError) throw dietTagsError;

        setCategories(categoriesData || []);
        setDietTags(dietTagsData || []);
      } catch (err) {
        console.error('Error fetching filters:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los filtros');
      } finally {
        setLoading(false);
      }
    }

    fetchFilters();
  }, []);

  return {
    categories,
    dietTags,
    loading,
    error,
  };
}
