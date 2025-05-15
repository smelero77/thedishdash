'use client';

import { useState, useEffect, useCallback } from 'react';
import { MenuRepository } from '../../domain/ports/MenuRepository';
import { MenuItem, WeatherContext } from '../../domain/types';

interface UseMenuProps {
  menuRepository: MenuRepository;
  currentSlotId: string;
  weatherContext?: WeatherContext;
}

interface UseMenuReturn {
  items: MenuItem[];
  isLoading: boolean;
  error: Error | null;
  filters: {
    itemType?: string;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    maxCalories?: number;
    drinkSize?: string;
    drinkTemperature?: string;
    drinkIce?: boolean;
    isAlcoholic?: boolean;
  };
  setFilters: (filters: Partial<UseMenuReturn['filters']>) => void;
  refreshItems: () => Promise<void>;
}

export function useMenu({ menuRepository, currentSlotId, weatherContext }: UseMenuProps): UseMenuReturn {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<UseMenuReturn['filters']>({});

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const menuItems = await menuRepository.findMenuItems(
        currentSlotId,
        filters,
        undefined,
        weatherContext
      );

      setItems(menuItems);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar los items del menú'));
    } finally {
      setIsLoading(false);
    }
  }, [menuRepository, currentSlotId, filters, weatherContext]);

  const updateFilters = useCallback((newFilters: Partial<UseMenuReturn['filters']>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Cargar items al montar el componente o cuando cambien las dependencias
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    isLoading,
    error,
    filters,
    setFilters: updateFilters,
    refreshItems: loadItems
  };
} 