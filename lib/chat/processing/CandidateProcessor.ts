import { SupabaseClient } from '@supabase/supabase-js';
import { MenuItemData } from '@/types/menu';
import { ERROR_CODES } from '../constants/config';
import { supabase } from '@/lib/supabase';

// Interfaz para los items del carrito obtenidos de la DB para este módulo
interface CartItemForProcessing {
  menu_item_id: string;
}

// Interfaz para la información de categoría enriquecida
interface CategoryInfo {
  id: string;
  name: string;
}

// Interfaz para el item enriquecido con información de categoría
interface EnrichedMenuItem extends MenuItemData {
  category_info: CategoryInfo[];
}

export class CandidateProcessor {
  private static instance: CandidateProcessor;

  private constructor(private supabaseClient: SupabaseClient) {}

  public static getInstance(supabaseClient: SupabaseClient): CandidateProcessor {
    if (!CandidateProcessor.instance) {
      CandidateProcessor.instance = new CandidateProcessor(supabaseClient);
    }
    return CandidateProcessor.instance;
  }

  /**
   * Obtiene un mapa de nombres de categorías para enriquecimiento
   */
  private async getCategoryNamesMap(categoryIds: string[]): Promise<Record<string, string>> {
    if (!categoryIds || categoryIds.length === 0) return {};

    try {
      const { data, error } = await this.supabaseClient
        .from('categories')
        .select('id, name')
        .in('id', categoryIds);

      if (error) {
        console.error('[CandidateProcessor] Error fetching category names:', error.message);
        throw {
          code: ERROR_CODES.DB_ERROR,
          message: 'Error al obtener nombres de categorías',
          originalError: error
        };
      }

      const map: Record<string, string> = {};
      data?.forEach(c => { map[c.id] = c.name; });
      return map;
    } catch (error) {
      console.error('[CandidateProcessor] Error in getCategoryNamesMap:', error);
      return {};
    }
  }

  /**
   * Procesa los candidatos de menú, enriqueciéndolos con información de categorías,
   * filtrando según disponibilidad y carrito actual, y ordenándolos por relevancia
   */
  public async processCandidates(
    searchedItems: MenuItemData[],
    rawCartItems: CartItemForProcessing[]
  ): Promise<MenuItemData[]> {
    try {
      if (!searchedItems || searchedItems.length === 0) {
        console.log('[CandidateProcessor] No hay items para procesar');
        return [];
      }

      console.log(`[CandidateProcessor] Procesando ${searchedItems.length} candidatos iniciales`);

      // 1. Enriquecer con category_info
      const allCategoryIds = Array.from(new Set(searchedItems.flatMap(i => i.category_ids || [])));
      const categoryNamesMap = await this.getCategoryNamesMap(allCategoryIds);

      const enrichedItems: EnrichedMenuItem[] = searchedItems.map(item => ({
        ...item,
        category_info: (item.category_ids || []).map(id => ({
          id,
          name: categoryNamesMap[id] || 'Categoría Desconocida'
        }))
      }));

      // 2. Filtrar items no disponibles y los que ya están en el carrito
      const cartItemIds = new Set(rawCartItems.map(item => item.menu_item_id));
      const finalCandidates = enrichedItems.filter(item =>
        item.is_available && !cartItemIds.has(item.id)
      );

      // 3. Ordenar por relevancia (profit_margin e is_recommended)
      const sortedCandidates = [...finalCandidates].sort((a, b) => {
        // Priorizar items recomendados
        if (a.is_recommended !== b.is_recommended) {
          return a.is_recommended ? -1 : 1;
        }

        // Luego ordenar por profit_margin
        const marginA = a.profit_margin || 0;
        const marginB = b.profit_margin || 0;
        return marginB - marginA;
      });

      // 4. Mantener al menos 4 candidatos si hay suficientes
      const minCandidates = Math.min(4, sortedCandidates.length);
      const finalResults = sortedCandidates.slice(0, minCandidates);
      
      console.log(`[CandidateProcessor] Candidatos finales después de procesar: ${finalResults.length}`);
      return finalResults;
    } catch (error) {
      console.error('[CandidateProcessor] Error processing candidates:', error);
      throw {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: 'Error al procesar candidatos',
        originalError: error
      };
    }
  }
}

// Exportar una instancia singleton
export const candidateProcessor = CandidateProcessor.getInstance(supabase); 