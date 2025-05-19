import { supabase } from '../../supabase';
import { ExtractedFilters, RpcFilterParameters } from '../types/extractedFilters.types';
import { CHAT_CONFIG } from '../constants/config';

const CACHE_CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hora
const CACHE_MAX_AGE = 1000 * 60 * 30; // 30 minutos

interface CacheEntry {
  id: string;
  timestamp: number;
}

export class FilterMapper {
  private static instance: FilterMapper;
  private categoryCache: Map<string, CacheEntry> = new Map();
  private allergenCache: Map<string, CacheEntry> = new Map();
  private dietTagCache: Map<string, CacheEntry> = new Map();
  private logger: Console;
  private cacheMetrics = {
    categoryHits: 0,
    categoryMisses: 0,
    allergenHits: 0,
    allergenMisses: 0,
    dietTagHits: 0,
    dietTagMisses: 0,
  };

  private constructor() {
    this.logger = console;
    this.startCacheCleanup();
  }

  public static getInstance(): FilterMapper {
    if (!FilterMapper.instance) {
      FilterMapper.instance = new FilterMapper();
    }
    return FilterMapper.instance;
  }

  private startCacheCleanup() {
    setInterval(() => {
      this.cleanupCache();
    }, CACHE_CLEANUP_INTERVAL);
  }

  private cleanupCache() {
    const now = Date.now();

    [this.categoryCache, this.allergenCache, this.dietTagCache].forEach((cache) => {
      Array.from(cache.entries()).forEach(([key, entry]) => {
        if (now - entry.timestamp > CACHE_MAX_AGE) {
          cache.delete(key);
        }
      });
    });

    this.logger.debug('[FilterMapper] Cache cleanup completed');
  }

  private async validateIds(ids: string[], table: string): Promise<string[]> {
    const { data, error } = await supabase.from(table).select('id').in('id', ids);

    if (error) {
      this.logger.error(`[FilterMapper] Error validating ${table} IDs:`, error);
      return [];
    }

    return data.map((item) => item.id);
  }

  /**
   * Mapea los filtros extraídos por la IA a parámetros RPC para la base de datos
   */
  public async mapToRpcParameters(filters: ExtractedFilters): Promise<RpcFilterParameters> {
    this.logger.debug('[FilterMapper] Iniciando mapeo de filtros');

    // Inicialización de variables de filtro
    const result: RpcFilterParameters = {
      p_item_type: filters.item_type || undefined,
      p_category_ids_include: undefined,
      p_slot_ids: undefined,
      p_allergen_ids_exclude: undefined,
      p_diet_tag_ids_include: undefined,
      p_is_vegetarian_base: filters.is_vegetarian_base || undefined,
      p_is_vegan_base: filters.is_vegan_base || undefined,
      p_is_gluten_free_base: filters.is_gluten_free_base || undefined,
      p_is_alcoholic: filters.is_alcoholic || undefined,
      p_calories_max: filters.calories_max || undefined,
      p_calories_min: filters.calories_min || undefined,
      p_price_max: filters.price_max || undefined,
      p_price_min: filters.price_min || undefined,
      p_keywords_include: filters.keywords_include || undefined,
      main_query: filters.main_query || undefined,
    };

    // Log específico para filtros de precio
    this.logger.debug('[FilterMapper] Mapeo de filtros de precio:', {
      price_min_input: filters.price_min,
      price_max_input: filters.price_max,
      price_min_output: result.p_price_min,
      price_max_output: result.p_price_max,
      timestamp: new Date().toISOString(),
    });

    try {
      // Mapear categorías
      if (filters.category_names?.length) {
        const categoryIds = await this.mapCategoryNamesToIds(filters.category_names);
        result.p_category_ids_include = await this.validateIds(categoryIds, 'categories');
      }

      // Mapear alérgenos
      if (filters.exclude_allergen_names?.length) {
        const allergenIds = await this.mapAllergenFilters(filters);
        result.p_allergen_ids_exclude = await this.validateIds(allergenIds, 'allergens');
      }

      // Mapear etiquetas dietéticas
      if (filters.include_diet_tag_names?.length) {
        const dietTagIds = await this.mapDietTagNamesToIds(filters.include_diet_tag_names);
        result.p_diet_tag_ids_include = await this.validateIds(dietTagIds, 'diet_tags');
      }

      this.logger.debug('[FilterMapper] Mapeo completado:', result);
      this.logCacheMetrics();

      return result;
    } catch (error) {
      this.logger.error('[FilterMapper] Error mapping filters to RPC parameters:', error);
      throw error;
    }
  }

  private logCacheMetrics() {
    this.logger.debug('[FilterMapper] Cache metrics:', {
      categories: {
        hits: this.cacheMetrics.categoryHits,
        misses: this.cacheMetrics.categoryMisses,
        hitRate: this.calculateHitRate(
          this.cacheMetrics.categoryHits,
          this.cacheMetrics.categoryMisses,
        ),
      },
      allergens: {
        hits: this.cacheMetrics.allergenHits,
        misses: this.cacheMetrics.allergenMisses,
        hitRate: this.calculateHitRate(
          this.cacheMetrics.allergenHits,
          this.cacheMetrics.allergenMisses,
        ),
      },
      dietTags: {
        hits: this.cacheMetrics.dietTagHits,
        misses: this.cacheMetrics.dietTagMisses,
        hitRate: this.calculateHitRate(
          this.cacheMetrics.dietTagHits,
          this.cacheMetrics.dietTagMisses,
        ),
      },
    });
  }

  private calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses;
    return total === 0 ? 0 : (hits / total) * 100;
  }

  /**
   * Mapea nombres de categorías a IDs
   */
  public async mapCategoryNamesToIds(names: string[]): Promise<string[]> {
    console.log('[FilterMapper] Iniciando mapeo de nombres de categorías:', {
      category_names: names,
      timestamp: new Date().toISOString(),
    });

    const ids: string[] = [];
    const namesToFetch: string[] = [];

    // Verificar caché primero
    for (const name of names) {
      const cachedEntry = this.categoryCache.get(name.toLowerCase());
      if (cachedEntry) {
        this.cacheMetrics.categoryHits++;
        console.log('[FilterMapper] Categoría encontrada en caché:', {
          name,
          id: cachedEntry.id,
          timestamp: new Date().toISOString(),
        });
        ids.push(cachedEntry.id);
      } else {
        this.cacheMetrics.categoryMisses++;
        namesToFetch.push(name);
        console.log('[FilterMapper] Categoría no encontrada en caché:', {
          name,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (namesToFetch.length > 0) {
      console.log('[FilterMapper] Buscando categorías en base de datos:', {
        names_to_fetch: namesToFetch,
        timestamp: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .or(namesToFetch.map((name) => `name.ilike.${name}`).join(','));

      if (error) {
        console.error('[FilterMapper] Error al buscar categorías:', {
          error,
          names_to_fetch: namesToFetch,
          timestamp: new Date().toISOString(),
        });
        throw new Error(`Error fetching category IDs: ${error.message}`);
      }

      console.log('[FilterMapper] Resultados de búsqueda en base de datos:', {
        found_categories: data?.map((c) => ({ id: c.id, name: c.name })),
        timestamp: new Date().toISOString(),
      });

      // Actualizar caché y recopilar IDs
      data?.forEach((category) => {
        const entry: CacheEntry = { id: category.id, timestamp: Date.now() };
        this.categoryCache.set(category.name.toLowerCase(), entry);
        ids.push(category.id);
      });
    }

    console.log('[FilterMapper] Mapeo de categorías completado:', {
      input_names: names,
      output_ids: ids,
      cache_hits: this.cacheMetrics.categoryHits,
      cache_misses: this.cacheMetrics.categoryMisses,
      timestamp: new Date().toISOString(),
    });

    return ids;
  }

  /**
   * Mapea nombres de alérgenos a IDs
   */
  private async mapAllergenFilters(filters: ExtractedFilters): Promise<string[]> {
    const allergenIds: string[] = [];

    if (filters.exclude_allergen_names?.length) {
      for (const allergenName of filters.exclude_allergen_names) {
        const allergenId = await this.getAllergenId(allergenName);
        if (allergenId) {
          allergenIds.push(allergenId);
        }
      }
    }

    return allergenIds;
  }

  /**
   * Mapea nombres de etiquetas dietéticas a IDs
   */
  private async mapDietTagNamesToIds(names: string[]): Promise<string[]> {
    const ids: string[] = [];
    const namesToFetch: string[] = [];

    // Verificar caché primero
    for (const name of names) {
      const cachedEntry = this.dietTagCache.get(name.toLowerCase());
      if (cachedEntry) {
        this.cacheMetrics.dietTagHits++;
        ids.push(cachedEntry.id);
      } else {
        this.cacheMetrics.dietTagMisses++;
        namesToFetch.push(name);
      }
    }

    if (namesToFetch.length > 0) {
      const { data, error } = await supabase
        .from('diet_tags')
        .select('id, name')
        .or(namesToFetch.map((name) => `name.ilike.${name}`).join(','));

      if (error) {
        throw new Error(`Error fetching diet tag IDs: ${error.message}`);
      }

      // Actualizar caché y recopilar IDs
      data?.forEach((tag) => {
        const entry: CacheEntry = { id: tag.id, timestamp: Date.now() };
        this.dietTagCache.set(tag.name.toLowerCase(), entry);
        ids.push(tag.id);
      });
    }

    return ids;
  }

  private async getAllergenId(name: string): Promise<string | null> {
    // Verificar caché primero
    const cachedEntry = this.allergenCache.get(name.toLowerCase());
    if (cachedEntry) {
      this.cacheMetrics.allergenHits++;
      return cachedEntry.id;
    }

    this.cacheMetrics.allergenMisses++;

    // Si no está en caché, buscar en la base de datos
    const { data, error } = await supabase.from('allergens').select('id, name').ilike('name', name);

    if (error) {
      console.error('[FilterMapper] Error fetching allergen ID:', error);
      return null;
    }

    if (data && data.length > 0) {
      const entry: CacheEntry = { id: data[0].id, timestamp: Date.now() };
      this.allergenCache.set(data[0].name.toLowerCase(), entry);
      return data[0].id;
    }

    return null;
  }

  /**
   * Limpia las cachés
   */
  public clearCaches(): void {
    this.categoryCache.clear();
    this.allergenCache.clear();
    this.dietTagCache.clear();
  }
}

// Exportar una instancia singleton
export const filterMapper = FilterMapper.getInstance();
