import { MenuItem } from '../entities/MenuItem';
import { MenuCombo } from '../entities/MenuCombo';
import { Filters, Slot } from '../entities';
import { WeatherContext } from '../entities/WeatherContext';
import { MenuRepository } from '../ports';

export class RecommendationService {
  constructor(private readonly menuRepository: MenuRepository) {}

  /**
   * Obtiene y rankea ítems de menú para un slot dado,
   * aplicando filtros de dominio y clima.
   */
  async getRecommendations(filters: Filters, slot: Slot | null): Promise<MenuItem[]> {
    if (!slot) {
      return [];
    }

    return this.menuRepository.getMenuItems(slot.id, filters);
  }

  /**
   * Crea un combo sencillo: un plato principal + la bebida mejor
   * puntuado por clima del resto de ítems de bebida.
   */
  async createCombo(
    mainItem: MenuItem,
    weatherContext?: WeatherContext
  ): Promise<MenuCombo> {
    // Buscamos bebidas excluyendo el plato principal
    const suggestedItems = await this.menuRepository.findMenuItems(
      mainItem.categoryIds?.[0] || '',
      { itemType: 'Bebida' },
      [mainItem.id],
      weatherContext
    );

    const ranked = this.rankItemsByWeather(suggestedItems, weatherContext);
    const bestMatch = ranked[0];

    return {
      id: crypto.randomUUID(),
      mainItem,
      suggestedItems: bestMatch ? [bestMatch] : [],
      totalPrice: mainItem.price + (bestMatch?.price || 0),
    };
  }

  /** Inserta un campo `weatherScore` y ordena descendente */
  private rankItemsByWeather(
    items: MenuItem[],
    weather?: WeatherContext
  ): MenuItem[] {
    if (!weather) return items;

    return items
      .map(item => ({
        ...item,
        weatherScore: this.calculateWeatherScore(item, weather),
      }))
      .sort((a, b) => (b.weatherScore || 0) - (a.weatherScore || 0));
  }

  /** Lógica de scoring basada en temperatura y condición */
  private calculateWeatherScore(
    item: MenuItem,
    weather: WeatherContext
  ): number {
    let score = 0;
    const temp = weather.temperature;
    const cond = weather.condition.toLowerCase();

    // Clima cálido
    if (temp > 25) {
      if (item.itemType === 'Bebida' && item.drinkTemperature === 'Frío') score += 2;
      if (item.itemType === 'Comida' && item.name.toLowerCase().includes('ensalada')) score += 1;
    }
    // Clima frío
    else if (temp < 15) {
      if (item.itemType === 'Bebida' && item.drinkTemperature === 'Caliente') score += 2;
      if (item.itemType === 'Comida' && item.name.toLowerCase().includes('sopa')) score += 1;
    }

    // Lluvia favorece platos calientes
    if (cond.includes('rain') || cond.includes('lluvia')) {
      if (item.itemType === 'Bebida' && item.drinkTemperature === 'Caliente') score += 1;
      if (item.itemType === 'Comida' && item.name.toLowerCase().includes('sopa')) score += 1;
    }

    return score;
  }
} 