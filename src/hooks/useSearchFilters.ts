import { useState, useCallback } from 'react';

export interface SearchFilters {
  categories: string[];
  priceRange: [number, number];
}

const INITIAL_PRICE_RANGE: [number, number] = [0, 150];

export const useSearchFilters = (onFilterSectionChange?: (section: string | null) => void) => {
  const [activeFilterModal, setActiveFilterModal] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    priceRange: INITIAL_PRICE_RANGE,
  });

  const openFilterModal = (modalName: string) => {
    setActiveFilterModal(modalName);
    onFilterSectionChange?.(modalName);
  };

  const closeFilterModal = () => {
    setActiveFilterModal(null);
    onFilterSectionChange?.(null);
  };

  const handleCategoryChange = useCallback((categories: string[]) => {
    setFilters((prev) => ({ ...prev, categories }));
  }, []);

  const handlePriceChange = useCallback((newRange: [number, number]) => {
    setFilters((prev) => ({ ...prev, priceRange: newRange }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      categories: [],
      priceRange: INITIAL_PRICE_RANGE,
    });
  }, []);

  const isAnyFilterActive =
    filters.categories.length > 0 ||
    filters.priceRange[0] !== INITIAL_PRICE_RANGE[0] ||
    filters.priceRange[1] !== INITIAL_PRICE_RANGE[1];

  return {
    activeFilterModal,
    openFilterModal,
    closeFilterModal,
    filters,
    handlers: {
      handleCategoryChange,
      handlePriceChange,
    },
    resetFilters,
    isAnyFilterActive,
  };
};
