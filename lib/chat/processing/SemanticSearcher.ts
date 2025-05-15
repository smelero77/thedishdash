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

    // Filtrar y añadir solo parámetros con valores válidos
    const filterParams = Object.entries(mappedRpcFilters).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          if (value.length > 0) acc[key] = value;
        } else if (typeof value === 'boolean') {
          acc[key] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          acc[key] = value;
        } else if (typeof value === 'number' && !isNaN(value)) {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    return { ...baseParams, ...filterParams };
  }

  private async executeRpcSearch(params: Record<string, any>): Promise<MenuItemData[]> {
    try {
      const { data, error } = await this.supabaseClient.rpc('match_menu_items', params);
      
      if (error) {
        this.logger.error('[SemanticSearcher] Error en RPC match_menu_items:', {
          error,
          params: {
            ...params,
            p_query_embedding: '[REDACTED]' // No logueamos el embedding por seguridad
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
          food_info, origin, pairing_suggestion_general, chef_notes, is_recommended,
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
        'pairing_suggestion_general' in menuItem &&
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
          pairing_suggestion: menuItem.pairing_suggestion_general ? String(menuItem.pairing_suggestion_general) : null,
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
      this.logger.debug('[SemanticSearcher] Iniciando búsqueda:', {
        query: mainQuery,
        filters: mappedRpcFilters
      });

      // 1. Búsqueda Semántica (RPC)
      const queryEmbedding = await this.getEmbedding(mainQuery);
      const rpcParams = this.prepareRpcParams(queryEmbedding, mappedRpcFilters);
      
      const rpcStartTime = Date.now();
      const rpcResults = await this.executeRpcSearch(rpcParams);
      metrics.rpcDuration = Date.now() - rpcStartTime;
      metrics.rpcResultCount = rpcResults.length;

      // 2. Fallback FTS si es necesario
      let finalResults = rpcResults;
      if (rpcResults.length < CHAT_CONFIG.minRelevantCandidatesThreshold && mainQuery.trim().length > FTS_MIN_TERM_LENGTH) {
        const ftsStartTime = Date.now();
        const ftsResults = await this.executeFtsSearch(mainQuery);
        metrics.ftsDuration = Date.now() - ftsStartTime;
        metrics.ftsResultCount = ftsResults.length;

        finalResults = this.mergeResults(rpcResults, ftsResults);
      }

      metrics.finalResultCount = finalResults.length;
      metrics.totalDuration = Date.now() - startTime;

      this.logger.debug('[SemanticSearcher] Métricas de búsqueda:', metrics);
      this.logger.debug('[SemanticSearcher] Resultados:', {
        count: finalResults.length,
        items: finalResults.map(i => i.name).slice(0, CHAT_CONFIG.maxCandidatesForGptContext)
      });

      return finalResults;

    } catch (error) {
      this.logger.error('[SemanticSearcher] Error en findRelevantItems:', error);
      throw error;
    }
  }
} 