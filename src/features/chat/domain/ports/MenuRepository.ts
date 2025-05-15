import { MenuItem, ModifierOption } from '../types';
import { WeatherContext } from '../types/WeatherContext';
import { Filters } from '../entities/Filters';
import { Slot } from '../entities/Slot';

export interface MenuRepository {
  /**
   * Busca todos los ítems de menú válidos para un slot,
   * aplicando filtros de dieta, calorías, tipo de bebida, clima, etc.
   */
  findMenuItems(
    slotId: string,
    filters: Filters,
    excludeIds: string[],
    weather?: WeatherContext
  ): Promise<MenuItem[]>;

  /**
   * Obtiene los modificadores de un plato (salsas, extras, etc.)
   */
  getModifiers(itemId: string): Promise<ModifierOption[]>;

  /**
   * Obtiene los ítems de menú para un slot específico
   */
  getMenuItems(slotId: string, filters: Filters): Promise<MenuItem[]>;

  /**
   * Obtiene el slot actual basado en la hora del día
   */
  getCurrentSlot(): Promise<Slot | null>;
} 