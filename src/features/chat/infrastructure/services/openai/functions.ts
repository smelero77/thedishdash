import { Slot } from '@/types/menu';
import { MenuItem, MenuCombo } from './types';

interface MenuItemWithTags {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  calories: number;
  dietary_tags: string[];
  allergens: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_healthy: boolean;
  is_light: boolean;
}

/**
 * Detecta el slot basado en palabras clave en el mensaje
 */
export function detectSlot(text: string, slots: Slot[]): Slot | null {
  const q = text.toLowerCase();
  
  // Buscar coincidencias exactas primero
  const exactMatch = slots.find(s => q.includes(s.name.toLowerCase()));
  if (exactMatch) return exactMatch;

  // Búsqueda por palabras clave
  if (q.includes('desayun')) return slots.find(s => s.name.toLowerCase().includes('desayun')) || null;
  if (q.includes('comid')) return slots.find(s => s.name.toLowerCase().includes('comid')) || null;
  if (q.includes('cen')) return slots.find(s => s.name.toLowerCase().includes('cen')) || null;
  if (q.includes('meriendan') || q.includes('merienda')) {
    return slots.find(s => s.name.toLowerCase().includes('meriendan') || s.name.toLowerCase().includes('merienda')) || null;
  }

  return null;
}

/**
 * Extrae filtros dietéticos del mensaje
 */
export function detectDietFilters(text: string): {
  maxCalories: number | null;
  tags: string[];
} {
  const q = text.toLowerCase();
  const filters = {
    maxCalories: null as number | null,
    tags: [] as string[]
  };

  // Detectar calorías
  if (q.includes('ligero') || q.includes('light')) {
    filters.maxCalories = 300;
    filters.tags.push('Ligero');
  }
  if (q.includes('muy ligero') || q.includes('ultra light')) {
    filters.maxCalories = 200;
    filters.tags.push('Ligero');
  }

  // Detectar tags dietéticos
  if (q.includes('vegetarian')) filters.tags.push('Vegetariano');
  if (q.includes('vegan')) filters.tags.push('Vegano');
  if (q.includes('sin gluten')) filters.tags.push('Sin Gluten');
  if (q.includes('saludable')) filters.tags.push('Saludable');

  // Detectar calorías específicas
  const caloriesMatch = text.match(/(\d+)\s*calorías?/i);
  if (caloriesMatch) {
    filters.maxCalories = parseInt(caloriesMatch[1]);
  }

  return filters;
}

/**
 * Filtra items según criterios de slot, calorías y etiquetas
 */
export function filterItems(
  items: MenuItemWithTags[],
  slot: string,
  maxCalories?: number,
  tags: string[] = []
): MenuItemWithTags[] {
  return items.filter(item => {
    // 1. Filtro de calorías
    if (maxCalories && item.calories > maxCalories) {
      return false;
    }

    // 2. Filtro de etiquetas
    if (tags.length > 0) {
      const itemTags = item.dietary_tags || [];
      if (!tags.every(tag => itemTags.includes(tag))) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Ordenar por relevancia (priorizar items que coincidan con más etiquetas)
    const aTags = a.dietary_tags || [];
    const bTags = b.dietary_tags || [];
    const aMatches = tags ? tags.filter(tag => aTags.includes(tag)).length : 0;
    const bMatches = tags ? tags.filter(tag => bTags.includes(tag)).length : 0;
    return bMatches - aMatches;
  });
}

/**
 * Calcula la relevancia de un item basado en sus etiquetas y filtros
 */
export function calculateRelevance(item: MenuItemWithTags, tags: string[]): number {
  const itemTags = item.dietary_tags || [];
  const matchingTags = tags.filter(tag => itemTags.includes(tag)).length;
  return matchingTags / tags.length;
}

/**
 * Formatea el mensaje de respuesta para el usuario
 */
export function formatResponseMessage(
  items: MenuItemWithTags[],
  slot: Slot | null,
  filters: { maxCalories: number | null; tags: string[] }
): string {
  const parts: string[] = [];

  // Añadir información del slot
  if (slot) {
    parts.push(`Para ${slot.name.toLowerCase()}, te recomiendo:`);
  }

  // Añadir información de filtros aplicados
  if (filters.tags.length > 0) {
    parts.push(`Platos ${filters.tags.join(', ').toLowerCase()}`);
  }
  if (filters.maxCalories) {
    parts.push(`con máximo ${filters.maxCalories} calorías`);
  }

  // Añadir recomendaciones
  if (items.length > 0) {
    parts.push('\nRecomendaciones:');
    items.forEach((item, index) => {
      parts.push(`${index + 1}. ${item.name} - ${item.price}€`);
      if (item.calories) {
        parts.push(`   ${item.calories} calorías`);
      }
      if (item.dietary_tags?.length) {
        parts.push(`   Etiquetas: ${item.dietary_tags.join(', ')}`);
      }
    });
  } else {
    parts.push('\nLo siento, no encontré platos que coincidan con tus criterios.');
  }

  return parts.join('\n');
}

export const getProductDetailsFn = {
  name: 'getProductDetails',
  description: 'Obtiene detalles de un plato o combo específico',
  parameters: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'ID del plato o combo'
      },
      productType: {
        type: 'string',
        enum: ['dish', 'combo'],
        description: 'Tipo de producto (plato o combo)'
      }
    },
    required: ['productId', 'productType']
  }
}; 