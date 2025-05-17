import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAIEmbeddingService } from '@/lib/embeddings/services/openai.service';
import { MenuItemData } from '@/types/menu';
import { RpcFilterParameters } from '../types/extractedFilters.types';
import { CHAT_CONFIG } from '../constants/config';

const FTS_MIN_TERM_LENGTH = 3;
const FTS_LANGUAGE = 'spanish';
const FTS_TYPE = 'plain';

interface SearchMetrics {
  rpcDuration: number;
  ftsDuration: number;
  totalDuration: number;
  rpcResultCount: number;
  ftsResultCount: number;
  finalResultCount: number;
}

export class SemanticSearcher {
  private static instance: SemanticSearcher;
  private logger: Console;

  private constructor(
    private embeddingService: OpenAIEmbeddingService,
    private supabaseClient: SupabaseClient
  ) {
    this.logger = console;
  }

  public static getInstance(
    embeddingService: OpenAIEmbeddingService,
    supabaseClient: SupabaseClient
  ): SemanticSearcher {
    if (!SemanticSearcher.instance) {
      SemanticSearcher.instance = new SemanticSearcher(embeddingService, supabaseClient);
    }
    return SemanticSearcher.instance;
  }

  private async getEmbedding(query: string): Promise<number[]> {
    try {
      return await this.embeddingService.getEmbedding(query);
    } catch (error) {
      this.logger.error('[SemanticSearcher] Error obteniendo embedding:', error);
      throw new Error('Error al procesar la consulta semántica');
    }
  }

  private prepareRpcParams(
    queryEmbedding: number[],
    mappedRpcFilters: RpcFilterParameters
  ): Record<string, any> {
    // Parámetros base requeridos
    const baseParams = {
      p_query_embedding: queryEmbedding,
      p_match_threshold: CHAT_CONFIG.semanticSearchMatchThreshold,
      p_match_count: CHAT_CONFIG.semanticSearchMatchCount
    } as const;

    // Crear una copia de los parámetros RPC para procesamiento
    const rpcParams: Record<string, any> = { ...baseParams };
    
    // IMPORTANTE: Procesar y agregar SIEMPRE los parámetros de precio si existen
    if (mappedRpcFilters.p_price_min !== undefined) {
      rpcParams.p_price_min = mappedRpcFilters.p_price_min;
    }
    
    if (mappedRpcFilters.p_price_max !== undefined) {
      rpcParams.p_price_max = mappedRpcFilters.p_price_max;
    }
    
    // Procesar el resto de parámetros
    Object.entries(mappedRpcFilters).forEach(([key, value]) => {
      // Saltar los parámetros de precio que ya fueron procesados
      if (key === 'p_price_min' || key === 'p_price_max') {
        return;
      }
      
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          if (value.length > 0) rpcParams[key] = value;
        } else if (typeof value === 'boolean') {
          rpcParams[key] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          rpcParams[key] = value;
        } else if (typeof value === 'number' && !isNaN(value)) {
          rpcParams[key] = value;
        }
      }
    });

    // Log detallado de todos los parámetros antes de la llamada a la función RPC
    this.logger.debug('[SemanticSearcher] PARÁMETROS RPC match_menu_items:', {
      query_embedding_length: queryEmbedding.length,
      match_threshold: rpcParams.p_match_threshold,
      match_count: rpcParams.p_match_count,
      price_min: rpcParams.p_price_min,
      price_max: rpcParams.p_price_max,
      item_type: rpcParams.p_item_type,
      is_vegetarian: rpcParams.p_is_vegetarian_base,
      is_vegan: rpcParams.p_is_vegan_base,
      is_gluten_free: rpcParams.p_is_gluten_free_base,
      is_alcoholic: rpcParams.p_is_alcoholic,
      calories_min: rpcParams.p_calories_min,
      calories_max: rpcParams.p_calories_max,
      category_ids: rpcParams.p_category_ids_include ? `[${rpcParams.p_category_ids_include.length} ids]` : null,
      allergen_ids: rpcParams.p_allergen_ids_exclude ? `[${rpcParams.p_allergen_ids_exclude.length} ids]` : null,
      diet_tag_ids: rpcParams.p_diet_tag_ids_include ? `[${rpcParams.p_diet_tag_ids_include.length} ids]` : null,
      keywords: rpcParams.p_keywords_include ? `[${rpcParams.p_keywords_include.length} keywords]` : null,
      timestamp: new Date().toISOString()
    });

    return rpcParams;
  }

  private async executeRpcSearch(params: Record<string, any>): Promise<MenuItemData[]> {
    try {
      // Registra los parámetros que se pasan a la función SQL (para debug)
      this.logger.debug('[SemanticSearcher] Ejecutando RPC match_menu_items con parámetros:', {
        ...Object.entries(params).reduce((acc, [key, value]) => {
          if (key !== 'p_query_embedding') { // No logueamos el embedding por seguridad
            acc[key] = value;
          } else {
            acc[key] = `[embedding de ${value.length} dimensiones]`;
          }
          return acc;
        }, {} as Record<string, any>),
        timestamp: new Date().toISOString()
      });

      const { data, error } = await this.supabaseClient.rpc('match_menu_items', params);
      
      if (error) {
        this.logger.error('[SemanticSearcher] Error en RPC match_menu_items:', {
          error,
          params: {
            ...Object.entries(params).reduce((acc, [key, value]) => {
              if (key !== 'p_query_embedding') {
                acc[key] = value;
              } else {
                acc[key] = '[REDACTED]';
              }
              return acc;
            }, {} as Record<string, any>)
          }
        });
        throw new Error(`Error en la búsqueda semántica: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        this.logger.error('[SemanticSearcher] Respuesta RPC inválida:', { data });
        throw new Error('Formato de respuesta inválido en la búsqueda semántica');
      }

      return data as MenuItemData[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error desconocido en la búsqueda semántica');
    }
  }

  private async executeFtsSearch(query: string): Promise<MenuItemData[]> {
    const ftsQuery = query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length >= FTS_MIN_TERM_LENGTH)
      .join(' & ');

    if (!ftsQuery) return [];

    const { data, error } = await this.supabaseClient
      .from('menu_item_embeddings')
      .select(`
        menu_items (
          id, name, description, price, image_url, category_ids, is_available,
          food_info, origin, pairing_suggestion, chef_notes, is_recommended,
          profit_margin, item_type, keywords, calories_est_min, calories_est_max,
          is_alcoholic, drink_type, drink_subtype, drink_characteristics,
          drink_volume_ml, drink_abv, drink_brand, wine_varietal, wine_region,
          is_new_item, is_seasonal, is_vegetarian_base, is_vegan_base,
          is_gluten_free_base,
          menu_item_allergens(allergens(id,name,icon_url)),
          menu_item_diet_tags(diet_tags(id,name)),
          modifiers(
            id, name, description, required, multi_select,
            modifier_options(
              id, name, extra_price, is_default, icon_url,
              related_menu_item_id,
              modifier_options_allergens(allergens(id,name,icon_url))
            )
          )
        )
      `)
      .textSearch('text', ftsQuery, { type: FTS_TYPE, config: FTS_LANGUAGE })
      .limit(CHAT_CONFIG.semanticSearchMatchCount);

    if (error) {
      this.logger.error('[SemanticSearcher] Error en búsqueda FTS:', error);
      return [];
    }

    // Validar y convertir los resultados
    const results: MenuItemData[] = [];
    for (const item of data || []) {
      const menuItem = item.menu_items;
      if (
        menuItem &&
        typeof menuItem === 'object' &&
        'id' in menuItem &&
        'name' in menuItem &&
        'description' in menuItem &&
        'price' in menuItem &&
        'category_ids' in menuItem &&
        'is_available' in menuItem &&
        'image_url' in menuItem &&
        'food_info' in menuItem &&
        'origin' in menuItem &&
        'pairing_suggestion' in menuItem &&
        'chef_notes' in menuItem &&
        'is_recommended' in menuItem &&
        'profit_margin' in menuItem &&
        'menu_item_allergens' in menuItem &&
        'menu_item_diet_tags' in menuItem &&
        'modifiers' in menuItem
      ) {
        // Convertir el objeto a MenuItemData con validación de tipos
        const menuItemData: MenuItemData = {
          id: String(menuItem.id),
          name: String(menuItem.name),
          description: String(menuItem.description),
          price: Number(menuItem.price),
          image_url: menuItem.image_url ? String(menuItem.image_url) : null,
          category_ids: Array.isArray(menuItem.category_ids) ? menuItem.category_ids.map(String) : [],
          is_available: Boolean(menuItem.is_available),
          food_info: menuItem.food_info ? String(menuItem.food_info) : null,
          origin: menuItem.origin ? String(menuItem.origin) : null,
          pairing_suggestion: menuItem.pairing_suggestion ? String(menuItem.pairing_suggestion) : null,
          chef_notes: menuItem.chef_notes ? String(menuItem.chef_notes) : null,
          is_recommended: Boolean(menuItem.is_recommended),
          profit_margin: Number(menuItem.profit_margin),
          allergens: Array.isArray(menuItem.menu_item_allergens) ? menuItem.menu_item_allergens.map((a: any) => a.allergens) : [],
          diet_tags: Array.isArray(menuItem.menu_item_diet_tags) ? menuItem.menu_item_diet_tags.map((d: any) => d.diet_tags.name) : [],
          modifiers: Array.isArray(menuItem.modifiers) ? menuItem.modifiers : []
        };
        results.push(menuItemData);
      }
    }

    return results;
  }

  private mergeResults(
    rpcResults: MenuItemData[],
    ftsResults: MenuItemData[]
  ): MenuItemData[] {
    const currentItemIds = new Set(rpcResults.map(item => item.id));
    const mergedResults = [...rpcResults];

    ftsResults.forEach(item => {
      if (item.is_available && !currentItemIds.has(item.id)) {
        mergedResults.push(item);
        currentItemIds.add(item.id);
      }
    });

    // Ordenar por relevancia (profit_margin como proxy)
    return mergedResults
      .sort((a, b) => (b.profit_margin || 0) - (a.profit_margin || 0))
      .slice(0, CHAT_CONFIG.semanticSearchMatchCount);
  }

  async findRelevantItems(
    mainQuery: string,
    mappedRpcFilters: RpcFilterParameters
  ): Promise<MenuItemData[]> {
    const startTime = Date.now();
    const metrics: SearchMetrics = {
      rpcDuration: 0,
      ftsDuration: 0,
      totalDuration: 0,
      rpcResultCount: 0,
      ftsResultCount: 0,
      finalResultCount: 0
    };

    try {
      // Log detallado de la consulta y filtros recibidos
      this.logger.debug('[SemanticSearcher] Iniciando búsqueda con filtros:', {
        query: mainQuery,
        price_min: mappedRpcFilters.p_price_min,
        price_max: mappedRpcFilters.p_price_max,
        item_type: mappedRpcFilters.p_item_type,
        is_vegetarian: mappedRpcFilters.p_is_vegetarian_base,
        is_vegan: mappedRpcFilters.p_is_vegan_base,
        is_gluten_free: mappedRpcFilters.p_is_gluten_free_base,
        timestamp: new Date().toISOString()
      });

      // 1. Búsqueda Semántica (RPC)
      const queryEmbedding = await this.getEmbedding(mainQuery);
      const rpcParams = this.prepareRpcParams(queryEmbedding, mappedRpcFilters);
      
      const rpcStartTime = Date.now();
      const rpcResults = await this.executeRpcSearch(rpcParams);
      const rpcDuration = Date.now() - rpcStartTime;
      
      metrics.rpcDuration = rpcDuration;
      metrics.rpcResultCount = rpcResults.length;

      // 2. Fallback FTS si es necesario
      let finalResults = rpcResults;
      if (rpcResults.length < CHAT_CONFIG.minRelevantCandidatesThreshold && mainQuery.trim().length > FTS_MIN_TERM_LENGTH) {
        const ftsStartTime = Date.now();
        const ftsResults = await this.executeFtsSearch(mainQuery);
        const ftsDuration = Date.now() - ftsStartTime;
        
        metrics.ftsDuration = ftsDuration;
        metrics.ftsResultCount = ftsResults.length;

        finalResults = this.mergeResults(rpcResults, ftsResults);
      }

      metrics.finalResultCount = finalResults.length;
      metrics.totalDuration = Date.now() - startTime;

      // Información resumida sobre los resultados
      this.logger.debug('[SemanticSearcher] Resultados de búsqueda:', {
        count: finalResults.length,
        metrics,
        filters_applied: {
          price_min: mappedRpcFilters.p_price_min !== null && mappedRpcFilters.p_price_min !== undefined,
          price_max: mappedRpcFilters.p_price_max !== null && mappedRpcFilters.p_price_max !== undefined,
          item_type: mappedRpcFilters.p_item_type !== null && mappedRpcFilters.p_item_type !== undefined,
          category: Array.isArray(mappedRpcFilters.p_category_ids_include) && mappedRpcFilters.p_category_ids_include.length > 0,
          allergens: Array.isArray(mappedRpcFilters.p_allergen_ids_exclude) && mappedRpcFilters.p_allergen_ids_exclude.length > 0,
          diet_tags: Array.isArray(mappedRpcFilters.p_diet_tag_ids_include) && mappedRpcFilters.p_diet_tag_ids_include.length > 0
        },
        items: finalResults.slice(0, 5).map(i => ({
          id: i.id,
          name: i.name,
          price: i.price
        }))
      });

      if (rpcResults.length > 0) {
        this.logger.debug('[SemanticSearcher] RESULTADOS VECTORIALES:', {
          count: rpcResults.length,
          items: rpcResults.slice(0, 10).map(i => ({ 
            name: i.name, 
            distance: (i as any).similarity 
          })),
          timestamp: new Date().toISOString()
        });
      }

      // Aplicar filtro adicional de precio después de obtener los resultados (redundante pero por seguridad)
      if (mappedRpcFilters.p_price_min !== undefined || mappedRpcFilters.p_price_max !== undefined) {
        const originalCount = finalResults.length;
        finalResults = await this.filterResultsByPrice(
          finalResults, 
          mappedRpcFilters.p_price_min as number | undefined, 
          mappedRpcFilters.p_price_max as number | undefined
        );
        
        // Registrar cambios en los resultados debido al filtrado de precio
        if (originalCount !== finalResults.length) {
          this.logger.debug(`[SemanticSearcher] Filtrado de precio post-búsqueda: ${originalCount} → ${finalResults.length} items`);
        }
      }

      return finalResults;
    } catch (error) {
      this.logger.error('[SemanticSearcher] Error en findRelevantItems:', error);
      throw error;
    }
  }

  /**
   * Filtra un conjunto de resultados por precio
   */
  public async filterResultsByPrice(
    items: MenuItemData[], 
    minPrice?: number, 
    maxPrice?: number | null
  ): Promise<MenuItemData[]> {
    if (!items || items.length === 0) {
      return [];
    }
    
    // Si no hay restricciones de precio, devolver todos los items
    if (minPrice === undefined && (maxPrice === undefined || maxPrice === null)) {
      return items;
    }
    
    this.logger.debug(`[SemanticSearcher] Filtrando ${items.length} items por precio: min=${minPrice}, max=${maxPrice}`);
    
    // Aplicar filtro
    const filtered = items.filter(item => {
      const price = Number(item.price);
      
      // No incluir items sin precio definido
      if (price === undefined || price === null || isNaN(price)) {
        return false;
      }
      
      // Aplicar filtros
      const passesMinFilter = minPrice === undefined || price >= minPrice;
      const passesMaxFilter = maxPrice === undefined || maxPrice === null || price <= maxPrice;
      
      const passes = passesMinFilter && passesMaxFilter;
      
      // Log detallado para debugging
      if (minPrice !== undefined || maxPrice !== undefined) {
        this.logger.debug(`[SemanticSearcher] Item ${item.name} (${price}€): min=${passesMinFilter}, max=${passesMaxFilter}, passes=${passes}`);
      }
      
      return passes;
    });
    
    this.logger.debug(`[SemanticSearcher] Resultado del filtrado por precio: ${filtered.length} items cumplen los criterios`);
    
    return filtered;
  }
} 