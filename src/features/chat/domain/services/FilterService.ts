import { Filters } from '../entities/Filters';
import { OpenAIClient } from '../ports/OpenAIClient';
import { FilterUtils } from './FilterUtils';
import { MenuItem } from '../entities/MenuItem';

export class FilterService {
  constructor(private openAIClient: OpenAIClient) {}

  async extractFilters(message: string): Promise<Filters> {
    try {
      const aiFilters = await this.openAIClient.analyzeUserQuery(message);
      return aiFilters;
    } catch (error) {
      console.error('Error extracting filters:', error);
      return {};
    }
  }

  applyFilters(item: MenuItem, filters: Filters): boolean {
    if (filters.itemType && item.itemType !== filters.itemType) {
      return false;
    }

    if (filters.isVegetarian && !item.isVegetarian) {
      return false;
    }

    if (filters.isVegan && !item.isVegan) {
      return false;
    }

    if (filters.isGlutenFree && !item.isGlutenFree) {
      return false;
    }

    if (filters.maxCalories && item.calories > filters.maxCalories) {
      return false;
    }

    if (filters.drinkSize && item.drinkSize !== filters.drinkSize) {
      return false;
    }

    if (filters.drinkTemperature && item.drinkTemperature !== filters.drinkTemperature) {
      return false;
    }

    if (filters.drinkIce !== undefined && item.drinkIce !== filters.drinkIce) {
      return false;
    }

    if (filters.isAlcoholic !== undefined && item.isAlcoholic !== filters.isAlcoholic) {
      return false;
    }

    return true;
  }
} 