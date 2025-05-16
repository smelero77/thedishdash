import { MenuItemData } from '@/types/menu';
import { CHAT_CONFIG } from '../constants/config';
import { ExtractedFilters } from '../types/extractedFilters.types';
import { ConversationTurn } from '../types/response.types';
import { RECOMMENDATION_SYSTEM_CONTEXT } from '../constants/prompts';

interface CartItemForContext {
  menu_items?: {
    name?: string;
    price?: number;
  } | null;
  quantity: number;
}

interface CategoryInfo {
  id: string;
  name: string;
}

interface EnrichedMenuItem extends MenuItemData {
  category_info?: CategoryInfo[];
  is_vegetarian_base?: boolean;
  is_vegan_base?: boolean;
  is_gluten_free_base?: boolean;
  is_new_item?: boolean;
  is_seasonal?: boolean;
  item_type?: string;
  is_alcoholic?: boolean;
  drink_type?: string;
  drink_volume_ml?: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface CaloriesRange {
  min: number;
  max: number;
}

export class ContextBuilder {
  private static instance: ContextBuilder;

  private constructor() {
    // Inicialización privada para singleton
  }

  public static getInstance(): ContextBuilder {
    if (!ContextBuilder.instance) {
      ContextBuilder.instance = new ContextBuilder();
    }
    return ContextBuilder.instance;
  }

  /**
   * Construye el contexto del carrito actual
   */
  public buildCartContext(cartItems: CartItemForContext[]): string {
    try {
      if (!cartItems || cartItems.length === 0) {
        return "El carrito del cliente está vacío.";
      }

      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cartItems.reduce((sum, item) => 
        sum + (item.menu_items?.price || 0) * item.quantity, 0);

      return "En el carrito del cliente ya tiene:\n" +
        cartItems
          .map((item: CartItemForContext) => {
            const name = item.menu_items?.name || 'Ítem desconocido';
            const price = item.menu_items?.price ? `${item.menu_items.price}€` : '';
            return `- ${name} x${item.quantity}${price ? ` (${price} c/u)` : ''}`;
          })
          .join("\n") +
        `\n\nTotal: ${totalItems} ítem${totalItems !== 1 ? 's' : ''} - ${totalPrice.toFixed(2)}€`;
    } catch (error) {
      console.error('[ContextBuilder] Error building cart context:', error);
      return "Error al construir el contexto del carrito.";
    }
  }

  /**
   * Construye el bloque de contexto para los candidatos
   */
  public buildCandidatesContextBlock(items: EnrichedMenuItem[]): string {
    try {
      if (!items || items.length === 0) {
        return "No hay candidatos específicos que cumplan los criterios para mostrar.";
      }

      // Limitar la cantidad de candidatos para no exceder tokens de GPT
      const itemsToShow = items.slice(0, CHAT_CONFIG.maxCandidatesForGptContext);

      // Crear una lista numerada con los IDs claramente marcados
      const candidatesBlock = itemsToShow.map((item, index) => {
        const description = item.description 
          ? item.description.length > 150 
            ? `${item.description.substring(0, 150)}...` 
            : item.description
          : '-';

        const categories = (item.category_info || [])
          .map(c => c.name)
          .join(', ') || 'N/A';

        const characteristics = this.getMenuItemCharacteristics(item);

        return `============= CANDIDATO ${index + 1} =============\n` +
          `  ID: "${item.id}" (IMPORTANTE: usa EXACTAMENTE este ID)\n` +
          `  Nombre: ${item.name}\n` +
          `  Precio: ${item.price}€\n` +
          `  Descripción: ${description}\n` +
          `  Categorías: ${categories}\n` +
          (characteristics ? `  Características: ${characteristics}\n` : '') +
          (item.is_recommended ? '  ¡Recomendado!\n' : '') +
          `============= FIN CANDIDATO ${index + 1} =============`;
      }).join("\n\n");

      // Añadir una nota enfática al principio
      return `IMPORTANTE: A continuación se lista TODOS los candidatos disponibles. DEBES usar EXCLUSIVAMENTE los IDs exactos proporcionados en esta lista. NUNCA inventes IDs ni uses nombres como si fueran IDs. Para cada plato recomendado, la razón de recomendación debe basarse ÚNICAMENTE en los atributos y características de ESE plato específico.\n\n${candidatesBlock}`;
    } catch (error) {
      console.error('[ContextBuilder] Error building candidates context:', error);
      return "Error al construir el contexto de candidatos.";
    }
  }

  /**
   * Construye el contexto para la extracción de filtros
   */
  public buildExtractionContext(
    userMessage: string,
    conversationHistory?: ConversationTurn[]
  ): string {
    try {
      let context = "Mensaje del usuario: " + userMessage;

      if (conversationHistory && conversationHistory.length > 0) {
        const relevantHistory = conversationHistory
          .slice(-3) // Usar un número fijo de turnos para el historial
          .map(turn => `${turn.role}: ${turn.content}`)
          .join("\n");

        context += "\n\nHistorial de conversación relevante:\n" + relevantHistory;
      }

      return context;
    } catch (error) {
      console.error('[ContextBuilder] Error building extraction context:', error);
      return userMessage;
    }
  }

  /**
   * Construye el contexto para recomendaciones
   */
  public buildRecommendationContext(
    currentFilters: ExtractedFilters,
    conversationHistory?: ConversationTurn[],
    candidates?: EnrichedMenuItem[]
  ): string {
    try {
      let context = "Filtros actuales:\n" + this.formatFilters(currentFilters);

      if (conversationHistory && conversationHistory.length > 0) {
        const relevantHistory = conversationHistory
          .slice(-5) // Usar un número fijo de turnos para el historial
          .map(turn => `${turn.role}: ${turn.content}`)
          .join("\n");

        context += "\n\nHistorial de conversación relevante:\n" + relevantHistory;
      }

      if (candidates && candidates.length > 0) {
        context += "\n\nCandidatos disponibles:\n" + this.buildCandidatesContextBlock(candidates);
      }

      return context;
    } catch (error) {
      console.error('[ContextBuilder] Error building recommendation context:', error);
      return "Error al construir el contexto de recomendación.";
    }
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
  private formatFilters(filters: ExtractedFilters): string {
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

    if (filters.price_range && typeof filters.price_range === 'object') {
      const priceRange = filters.price_range as PriceRange;
      parts.push(`Rango de precio: ${priceRange.min}€ - ${priceRange.max}€`);
    }

    if (filters.calories_range && typeof filters.calories_range === 'object') {
      const caloriesRange = filters.calories_range as CaloriesRange;
      parts.push(`Rango de calorías: ${caloriesRange.min} - ${caloriesRange.max}`);
    }

    return parts.join('\n');
  }
}

// Exportar una instancia singleton
export const contextBuilder = ContextBuilder.getInstance(); 