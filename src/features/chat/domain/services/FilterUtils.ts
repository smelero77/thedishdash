import { Filters } from '../entities/Filters';

export class FilterUtils {
  static detectDietFilters(text: string): Partial<Filters> {
    const filters: Partial<Filters> = {};
    
    // Detectar límite de calorías
    const calorieMatch = text.match(/(\d+)\s*(?:calorías|cal)/i);
    if (calorieMatch) {
      filters.maxCalories = parseInt(calorieMatch[1]);
    }

    // Detectar tags dietéticos
    const tags = [];
    if (text.match(/vegetarian[oa]/i)) tags.push('Vegetariano');
    if (text.match(/vegan[oa]/i)) tags.push('Vegano');
    if (text.match(/sin\s+gluten/i)) tags.push('Sin Gluten');
    if (text.match(/saludable/i)) tags.push('Saludable');
    if (text.match(/liger[oa]/i)) tags.push('Ligero');

    if (tags.includes('Vegetariano')) filters.isVegetarian = true;
    if (tags.includes('Vegano')) filters.isVegan = true;
    if (tags.includes('Sin Gluten')) filters.isGlutenFree = true;

    return filters;
  }

  static detectDrinkFilters(text: string): Partial<Filters> {
    const filters: Partial<Filters> = {};

    // Detectar tamaño
    if (text.match(/pequeñ[oa]/i)) filters.drinkSize = 'pequeño';
    else if (text.match(/median[oa]/i)) filters.drinkSize = 'mediano';
    else if (text.match(/grande/i)) filters.drinkSize = 'grande';

    // Detectar temperatura
    if (text.match(/frí[oa]/i)) filters.drinkTemperature = 'frío';
    else if (text.match(/caliente/i)) filters.drinkTemperature = 'caliente';

    // Detectar hielo
    if (text.match(/sin\s+hielo/i)) filters.drinkIce = false;
    else if (text.match(/con\s+hielo/i)) filters.drinkIce = true;

    // Detectar alcohol
    if (text.match(/alcohólic[oa]/i)) filters.isAlcoholic = true;
    else if (text.match(/sin\s+alcohol/i)) filters.isAlcoholic = false;

    return filters;
  }
} 