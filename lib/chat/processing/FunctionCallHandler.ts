import OpenAI from 'openai';
import { z } from 'zod';
import { AssistantResponse } from '../types/response.types';
import { Recommendation } from '../types/recommendation.types';
import { ExtractedFilters } from '../types/extractedFilters.types';
import { SYSTEM_MESSAGE_TYPES, ERROR_CODES } from '../constants/config';
import { OPENAI_FUNCTIONS } from '../constants/functions';
import { supabase } from '@/lib/supabase';
import { MenuItemData, SupabaseMenuItem } from '@/types/menu';
import { Allergen } from '@/types/modifiers';
import { CHAT_CONFIG } from '../constants/config';
import { getMenuItemById } from '@/lib/data';
import { processMenuItem } from '@/utils/menu';

// Esquemas de validación con Zod
const PriceRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
});

const CaloriesRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
});

const ExtractedFiltersSchema = z.object({
  main_query: z.string(),
  item_type: z.enum(['Comida', 'Bebida']).optional(),
  categories: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  diet_tags: z.array(z.string()).optional(),
  price_range: PriceRangeSchema.optional(),
  calories_range: CaloriesRangeSchema.optional(),
});

const ProductDetailsSchema = z.object({
  product_id: z.string().uuid(),
  is_price_query: z.boolean().optional().default(false),
});

interface CategoryInfo {
  id: string;
  name: string;
}

interface EnrichedMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  category_info?: CategoryInfo[];
  food_info?: string | null;
  origin?: string | null;
  pairing_suggestion?: string | null;
  chef_notes?: string;
  calories_est_min?: number;
  calories_est_max?: number;
  is_vegetarian_base?: boolean;
  is_vegan_base?: boolean;
  is_gluten_free_base?: boolean;
  is_new_item?: boolean;
  is_seasonal?: boolean;
  item_type?: string;
  is_alcoholic?: boolean;
  drink_type?: string;
  drink_volume_ml?: number;
  profit_margin?: number;
  allergens?: Allergen[];
  diet_tags?: string[];
  modifiers?: any[];
  is_available?: boolean;
  is_recommended?: boolean;
}

/**
 * Clase responsable de manejar las llamadas a funciones del asistente
 */
export class FunctionCallHandler {
  private static instance: FunctionCallHandler;
  private openai: OpenAI;

  private constructor(private openaiApiKey: string) {
    if (!openaiApiKey) {
      throw new Error('API key is required for FunctionCallHandler');
    }
    this.openai = new OpenAI({ apiKey: this.openaiApiKey });
  }

  /**
   * Obtiene la instancia singleton del manejador de llamadas a funciones
   */
  public static getInstance(openaiApiKey: string): FunctionCallHandler {
    if (!FunctionCallHandler.instance) {
      FunctionCallHandler.instance = new FunctionCallHandler(openaiApiKey);
    }
    return FunctionCallHandler.instance;
  }

  /**
   * Maneja una llamada a función del asistente
   */
  public async handleFunctionCall(
    functionName: string,
    args: any,
    context: any,
  ): Promise<AssistantResponse> {
    try {
      console.log('[FunctionCallHandler] Procesando llamada a función:', functionName);

      switch (functionName) {
        case 'extract_filters':
          return await this.handleExtractFilters(args);
        case 'request_clarification':
          return await this.handleRequestClarification(args);
        case 'provide_recommendations':
          return await this.handleProvideRecommendations(args);
        case 'get_product_details':
          return await this.handleGetProductDetails(args);
        case 'recommend_dishes':
          return await this.handleProvideRecommendations(args);
        default:
          throw new Error(`Función no soportada: ${functionName}`);
      }
    } catch (error) {
      console.error('[FunctionCallHandler] Error procesando llamada a función:', error);
      throw new Error(ERROR_CODES.UNKNOWN_ERROR);
    }
  }

  /**
   * Maneja la extracción de filtros
   */
  private async handleExtractFilters(args: any): Promise<AssistantResponse> {
    try {
      // Validar argumentos con Zod
      const validatedArgs = ExtractedFiltersSchema.parse(args);

      return {
        type: SYSTEM_MESSAGE_TYPES.INFO,
        content: this.formatExtractedFilters(validatedArgs),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[FunctionCallHandler] Error de validación:', error.errors);
        throw new Error(ERROR_CODES.INVALID_FILTERS);
      }
      throw error;
    }
  }

  /**
   * Maneja la solicitud de aclaración
   */
  private async handleRequestClarification(args: any): Promise<AssistantResponse> {
    try {
      const { question } = z
        .object({
          question: z.string().min(1),
        })
        .parse(args);

      return {
        type: SYSTEM_MESSAGE_TYPES.CLARIFICATION,
        content: question,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[FunctionCallHandler] Error de validación:', error.errors);
        throw new Error(ERROR_CODES.INVALID_FILTERS);
      }
      throw error;
    }
  }

  /**
   * Maneja el envío de recomendaciones
   */
  private async handleProvideRecommendations(args: any): Promise<AssistantResponse> {
    try {
      // Primero intentamos parsear los argumentos si vienen como string
      let parsedArgs = args;
      if (typeof args === 'string') {
        try {
          parsedArgs = JSON.parse(args);
        } catch (e) {
          console.error('[FunctionCallHandler] Error parsing function call arguments:', args, e);
          throw new Error(ERROR_CODES.INVALID_FILTERS);
        }
      }

      // Validar argumentos con Zod
      const { recommendations } = z
        .object({
          recommendations: z.array(
            z.object({
              id: z.string().uuid(),
              reason: z.string().min(1),
            }),
          ),
        })
        .parse(parsedArgs);

      // Obtener detalles completos de cada plato recomendado
      const enrichedRecommendations = await Promise.all(
        recommendations.map(async (rec) => {
          // Primero obtener el item del menú
          const { data: menuItem, error: menuItemError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('id', rec.id)
            .single();

          if (menuItemError || !menuItem) {
            console.error(`Error obteniendo detalles del plato ${rec.id}:`, menuItemError);
            return null;
          }

          // Luego obtener las categorías usando los IDs
          let categoryInfo: Array<{ id: string; name: string }> = [];
          if (menuItem.category_ids && menuItem.category_ids.length > 0) {
            const { data: categories, error: categoriesError } = await supabase
              .from('categories')
              .select('id, name')
              .in('id', menuItem.category_ids);

            if (!categoriesError && categories) {
              categoryInfo = categories;
            }
          }

          return {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            reason: rec.reason,
            image_url: menuItem.image_url,
            category_info: categoryInfo,
          };
        }),
      );

      // Filtrar recomendaciones nulas
      const validRecommendations = enrichedRecommendations.filter(
        (rec): rec is NonNullable<typeof rec> => rec !== null,
      );

      if (validRecommendations.length === 0) {
        throw new Error('No se pudieron obtener los detalles de los platos recomendados');
      }

      return {
        type: SYSTEM_MESSAGE_TYPES.RECOMMENDATION,
        content: this.formatRecommendations(validRecommendations),
        data: validRecommendations,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[FunctionCallHandler] Error de validación:', error.errors);
        throw new Error(ERROR_CODES.INVALID_FILTERS);
      }
      throw error;
    }
  }

  /**
   * Transforma un SupabaseMenuItem a EnrichedMenuItem
   */
  private transformToEnrichedMenuItem(menuItem: SupabaseMenuItem): EnrichedMenuItem {
    // Primero procesamos el item base usando la función existente
    const baseItem = processMenuItem(menuItem);

    // Luego añadimos los campos enriquecidos
    const enrichedItem: EnrichedMenuItem = {
      ...baseItem,
      description: baseItem.description || undefined,
      image_url: baseItem.image_url || '',
      chef_notes: baseItem.chef_notes || undefined,
      category_info: [],
      is_vegetarian_base: menuItem.food_info?.includes('vegetarian') || false,
      is_vegan_base: menuItem.food_info?.includes('vegan') || false,
      is_gluten_free_base: menuItem.food_info?.includes('gluten_free') || false,
      is_new_item: menuItem.food_info?.includes('new') || false,
      is_seasonal: menuItem.food_info?.includes('seasonal') || false,
      item_type: menuItem.food_info?.includes('drink') ? 'Bebida' : 'Comida',
      is_alcoholic: menuItem.food_info?.includes('alcoholic') || false,
      drink_type: menuItem.food_info?.includes('drink') ? 'Bebida' : undefined,
      drink_volume_ml: menuItem.food_info?.includes('drink') ? 330 : undefined,
      profit_margin: menuItem.profit_margin || undefined,
      allergens: baseItem.allergens,
      diet_tags: baseItem.diet_tags,
      modifiers: baseItem.modifiers,
      is_available: baseItem.is_available,
      is_recommended: baseItem.is_recommended,
    };

    return enrichedItem;
  }

  /**
   * Maneja la obtención de detalles de un producto
   */
  private async handleGetProductDetails(args: any): Promise<AssistantResponse> {
    try {
      let parsedArgs: any;

      try {
        if (typeof args === 'string') {
          parsedArgs = JSON.parse(args);
        } else {
          parsedArgs = args;
        }
      } catch (e) {
        console.error('[FunctionCallHandler] Error parsing function call arguments:', args, e);
        throw new Error(ERROR_CODES.INVALID_FILTERS);
      }

      // Validar argumentos con Zod
      const { product_id, is_price_query } = ProductDetailsSchema.parse(parsedArgs);

      // Obtener detalles del producto usando la función getMenuItemById
      const { menuItem, error: dbError } = await getMenuItemById(product_id);

      if (dbError || !menuItem) {
        console.error(
          `[FunctionCallHandler] Could not retrieve or menuItem is null for ID: ${product_id}. DB Error:`,
          dbError,
        );
        throw new Error(ERROR_CODES.DB_ERROR);
      }

      // Transformar el menuItem a EnrichedMenuItem
      const enrichedMenuItem = this.transformToEnrichedMenuItem(menuItem);

      // Si la consulta es específicamente sobre el precio, simplificar la respuesta
      if (is_price_query) {
        return {
          type: 'product_details',
          content: `Las ${enrichedMenuItem.name} cuestan ${enrichedMenuItem.price}€.`,
          product: {
            item: enrichedMenuItem,
            explanation: `Las ${enrichedMenuItem.name} cuestan ${enrichedMenuItem.price}€.`,
          },
        };
      }

      // Generar una explicación concisa usando IA
      const explanation = await this.generateProductExplanation(enrichedMenuItem);

      return {
        type: 'product_details',
        content: explanation,
        product: {
          item: enrichedMenuItem,
          explanation: explanation,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[FunctionCallHandler] Error de validación:', error.errors);
        throw new Error(ERROR_CODES.INVALID_FILTERS);
      }
      throw error;
    }
  }

  /**
   * Genera una explicación concisa del producto usando IA
   */
  private async generateProductExplanation(menuItem: EnrichedMenuItem): Promise<string> {
    try {
      const prompt = this.buildProductExplanationPrompt(menuItem);

      const response = await this.openai.chat.completions.create({
        model: CHAT_CONFIG.productExplanationModel,
        messages: [
          {
            role: 'system',
            content:
              'Eres un experto en gastronomía y servicio al cliente. Tu tarea es generar una explicación concisa y atractiva de un producto del menú, destacando sus características más relevantes en máximo 3 líneas.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: CHAT_CONFIG.productExplanationTemperature,
        max_tokens: 150, // Reducimos el número máximo de tokens para respuestas más concisas
      });

      return response.choices[0].message.content || 'No se pudo generar una explicación detallada.';
    } catch (error) {
      console.error('[FunctionCallHandler] Error generando explicación:', error);
      return this.generateFallbackExplanation(menuItem);
    }
  }

  /**
   * Construye el prompt para la explicación del producto
   */
  private buildProductExplanationPrompt(menuItem: EnrichedMenuItem): string {
    const characteristics = this.getMenuItemCharacteristics(menuItem);
    const categories = menuItem.category_info?.map((c) => c.name).join(', ') || 'N/A';
    const allergens = menuItem.allergens?.map((a) => a.name).join(', ') || 'Ninguno';
    const dietTags = menuItem.diet_tags?.join(', ') || 'Ninguno';

    return `
      Genera una explicación concisa y atractiva para el siguiente producto:
      
      Nombre: ${menuItem.name}
      Precio: ${menuItem.price}€
      Descripción: ${menuItem.description || 'No disponible'}
      Categorías: ${categories}
      Características: ${characteristics}
      Alérgenos: ${allergens}
      Etiquetas dietéticas: ${dietTags}
      ${menuItem.chef_notes ? `Notas del chef: ${menuItem.chef_notes}` : ''}
      ${menuItem.pairing_suggestion ? `Sugerencias de maridaje: ${menuItem.pairing_suggestion}` : ''}
      
      La explicación debe ser natural, informativa y enfocada en destacar los aspectos más relevantes del producto.
    `;
  }

  /**
   * Genera una explicación alternativa cuando falla la IA
   */
  private generateFallbackExplanation(menuItem: EnrichedMenuItem): string {
    const characteristics = this.getMenuItemCharacteristics(menuItem);
    return `${menuItem.name} (${menuItem.price}€) - ${menuItem.description || ''} ${characteristics ? `(${characteristics})` : ''}`;
  }

  /**
   * Obtiene las características relevantes de un ítem del menú
   */
  private getMenuItemCharacteristics(item: EnrichedMenuItem): string {
    const characteristics: string[] = [];

    if (item.is_vegetarian_base) characteristics.push('Vegetariano');
    if (item.is_vegan_base) characteristics.push('Vegano');
    if (item.is_gluten_free_base) characteristics.push('Sin Gluten');
    if (item.is_new_item) characteristics.push('Nuevo');
    if (item.is_seasonal) characteristics.push('De Temporada');

    if (item.item_type === 'Bebida') {
      if (item.is_alcoholic) characteristics.push('Alcohólica');
      if (item.drink_type) characteristics.push(item.drink_type);
      if (item.drink_volume_ml) characteristics.push(`${item.drink_volume_ml}ml`);
    }

    return characteristics.join(', ');
  }

  /**
   * Formatea los filtros extraídos en un formato legible
   */
  private formatExtractedFilters(filters: ExtractedFilters): string {
    const parts: string[] = [];

    if (filters.main_query) {
      parts.push(`Búsqueda principal: "${filters.main_query}"`);
    }

    if (filters.item_type) {
      parts.push(`Tipo: ${filters.item_type}`);
    }

    if (Array.isArray(filters.categories) && filters.categories.length > 0) {
      parts.push(`Categorías: ${filters.categories.join(', ')}`);
    }

    if (Array.isArray(filters.allergens) && filters.allergens.length > 0) {
      parts.push(`Alérgenos a evitar: ${filters.allergens.join(', ')}`);
    }

    if (Array.isArray(filters.diet_tags) && filters.diet_tags.length > 0) {
      parts.push(`Preferencias dietéticas: ${filters.diet_tags.join(', ')}`);
    }

    if (
      filters.price_range &&
      typeof filters.price_range === 'object' &&
      typeof (filters.price_range as any).min === 'number' &&
      typeof (filters.price_range as any).max === 'number'
    ) {
      parts.push(
        `Rango de precio: ${(filters.price_range as any).min}€ - ${(filters.price_range as any).max}€`,
      );
    }

    if (
      filters.calories_range &&
      typeof filters.calories_range === 'object' &&
      typeof (filters.calories_range as any).min === 'number' &&
      typeof (filters.calories_range as any).max === 'number'
    ) {
      parts.push(
        `Rango de calorías: ${(filters.calories_range as any).min} - ${(filters.calories_range as any).max}`,
      );
    }

    return parts.join('\n');
  }

  /**
   * Formatea las recomendaciones en un formato legible
   */
  private formatRecommendations(recommendations: Recommendation[]): string {
    return recommendations
      .map((rec) => {
        const categoryNames = rec.category_info?.map((c) => c.name).join(', ') || 'Sin categoría';
        const priceInfo = rec.price ? ` (${rec.price}€)` : '';
        return `- ${rec.name || 'Plato'}${priceInfo} - ${categoryNames}\n  ${rec.reason}`;
      })
      .join('\n\n');
  }
}

// Exportar una instancia singleton
export const functionCallHandler = FunctionCallHandler.getInstance(
  process.env.OPENAI_API_KEY || '',
);
