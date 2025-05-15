import { MenuItem } from '../entities/MenuItem';
import { MenuCombo } from '../entities/MenuCombo';
import { Filters, Slot } from '../entities';
import { WeatherContext } from '../types/WeatherContext';
import { MenuRepository, RecommendationService as IRecommendationService } from '../ports';

export class RecommendationService implements IRecommendationService {
  constructor(private readonly menuRepository: MenuRepository) {}

  /**
   * Obtiene recomendaciones de ítems de menú para una sesión
   */
  async getRecommendations(sessionId: string, filters?: Filters): Promise<MenuItem[]> {
    // Por ahora, devolvemos recomendaciones basadas en el slot actual
    const slot = await this.menuRepository.getCurrentSlot();
    if (!slot) {
      return [];
    }

    return this.menuRepository.getMenuItems(slot.id, filters || {});
  }

  /**
   * Obtiene combos sugeridos para una sesión
   */
  async getCombos(sessionId: string): Promise<MenuCombo[]> {
    // Por ahora, devolvemos un array vacío
    // TODO: Implementar lógica de combos basada en el historial de la sesión
    return [];
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