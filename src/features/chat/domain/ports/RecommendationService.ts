import { MenuItem } from '../entities/MenuItem';
import { MenuCombo } from '../entities/MenuCombo';
import { Filters, Slot } from '../entities';

export interface RecommendationService {
  /**
   * Obtiene recomendaciones de ítems de menú para una sesión
   */
  getRecommendations(sessionId: string, filters?: Filters): Promise<MenuItem[]>;

  /**
   * Obtiene combos sugeridos para una sesión
   */
  getCombos(sessionId: string): Promise<MenuCombo[]>;
} 