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
    dietTagMisses: 0
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
    
    [this.categoryCache, this.allergenCache, this.dietTagCache].forEach(cache => {
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > CACHE_MAX_AGE) {
          cache.delete(key);
        }
      }
    });

    this.logger.debug('[FilterMapper] Cache cleanup completed');
  }

  private async validateIds(ids: string[], table: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .in('id', ids);

    if (error) {
      this.logger.error(`[FilterMapper] Error validating ${table} IDs:`, error);
      return [];
    }

    return data.map(item => item.id);
  }

  /**
   * Mapea los filtros extraídos a parámetros RPC
   */
  public async mapToRpcParameters(filters: ExtractedFilters): Promise<RpcFilterParameters> {
    try {
      this.logger.debug('[FilterMapper] Iniciando mapeo de filtros:', filters);

      const rpcParams: RpcFilterParameters = {
        p_item_type: filters.item_type || null,
        p_is_vegetarian_base: filters.is_vegetarian_base || null,
        p_is_vegan_base: filters.is_vegan_base || null,
        p_is_gluten_free_base: filters.is_gluten_free_base || null,
        p_is_alcoholic: filters.is_alcoholic || null,
        p_calories_max: filters.calories_max || null,
        p_calories_min: filters.calories_min || null,
        p_price_max: filters.price_max || null,
        p_price_min: filters.price_min || null,
        p_keywords_include: filters.keywords_include || null
      };

      // Mapear categorías
      if (filters.category_names?.length) {
        const categoryIds = await this.mapCategoryNamesToIds(filters.category_names);
        rpcParams.p_category_ids_include = await this.validateIds(categoryIds, 'categories');
      }

      // Mapear alérgenos
      if (filters.exclude_allergen_names?.length) {
        const allergenIds = await this.mapAllergenNamesToIds(filters.exclude_allergen_names);
        rpcParams.p_allergen_ids_exclude = await this.validateIds(allergenIds, 'allergens');
      }

      // Mapear etiquetas dietéticas
      if (filters.include_diet_tag_names?.length) {
        const dietTagIds = await this.mapDietTagNamesToIds(filters.include_diet_tag_names);
        rpcParams.p_diet_tag_ids_include = await this.validateIds(dietTagIds, 'diet_tags');
      }

      this.logger.debug('[FilterMapper] Mapeo completado:', rpcParams);
      this.logCacheMetrics();

      return rpcParams;
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
        hitRate: this.calculateHitRate(this.cacheMetrics.categoryHits, this.cacheMetrics.categoryMisses)
      },
      allergens: {
        hits: this.cacheMetrics.allergenHits,
        misses: this.cacheMetrics.allergenMisses,
        hitRate: this.calculateHitRate(this.cacheMetrics.allergenHits, this.cacheMetrics.allergenMisses)
      },
      dietTags: {
        hits: this.cacheMetrics.dietTagHits,
        misses: this.cacheMetrics.dietTagMisses,
        hitRate: this.calculateHitRate(this.cacheMetrics.dietTagHits, this.cacheMetrics.dietTagMisses)
      }
    });
  }

  private calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses;
    return total === 0 ? 0 : (hits / total) * 100;
  }

  /**
   * Mapea nombres de categorías a IDs
   */
  private async mapCategoryNamesToIds(names: string[]): Promise<string[]> {
    const ids: string[] = [];
    const namesToFetch: string[] = [];

    // Verificar caché primero
    for (const name of names) {
      const cachedEntry = this.categoryCache.get(name.toLowerCase());
      if (cachedEntry) {
        this.cacheMetrics.categoryHits++;
        ids.push(cachedEntry.id);
      } else {
        this.cacheMetrics.categoryMisses++;
        namesToFetch.push(name);
      }
    }

    if (namesToFetch.length > 0) {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .in('name', namesToFetch);

      if (error) {
        throw new Error(`Error fetching category IDs: ${error.message}`);
      }

      // Actualizar caché y recopilar IDs
      data?.forEach(category => {
        const entry: CacheEntry = { id: category.id, timestamp: Date.now() };
        this.categoryCache.set(category.name.toLowerCase(), entry);
        ids.push(category.id);
      });
    }

    return ids;
  }

  /**
   * Mapea nombres de alérgenos a IDs
   */
  private async mapAllergenNamesToIds(names: string[]): Promise<string[]> {
    const ids: string[] = [];
    const namesToFetch: string[] = [];

    // Verificar caché primero
    for (const name of names) {
      const cachedEntry = this.allergenCache.get(name.toLowerCase());
      if (cachedEntry) {
        this.cacheMetrics.allergenHits++;
        ids.push(cachedEntry.id);
      } else {
        this.cacheMetrics.allergenMisses++;
        namesToFetch.push(name);
      }
    }

    if (namesToFetch.length > 0) {
      const { data, error } = await supabase
        .from('allergens')
        .select('id, name')
        .in('name', namesToFetch);

      if (error) {
        throw new Error(`Error fetching allergen IDs: ${error.message}`);
      }

      // Actualizar caché y recopilar IDs
      data?.forEach(allergen => {
        const entry: CacheEntry = { id: allergen.id, timestamp: Date.now() };
        this.allergenCache.set(allergen.name.toLowerCase(), entry);
        ids.push(allergen.id);
      });
    }

    return ids;
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
        .in('name', namesToFetch);

      if (error) {
        throw new Error(`Error fetching diet tag IDs: ${error.message}`);
      }

      // Actualizar caché y recopilar IDs
      data?.forEach(tag => {
        const entry: CacheEntry = { id: tag.id, timestamp: Date.now() };
        this.dietTagCache.set(tag.name.toLowerCase(), entry);
        ids.push(tag.id);
      });
    }

    return ids;
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