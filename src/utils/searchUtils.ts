import { MenuItemData } from '@/types/menu';
import { SearchFilters } from '@/hooks/useSearchFilters';

const normalizeText = (text: string = ''): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export const searchMenuItems = (
  items: MenuItemData[],
  query: string,
  filters: SearchFilters,
): Promise<MenuItemData[]> => {
  return new Promise((resolve) => {
    const normalizedQuery = normalizeText(query);

    const filteredItems = items.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(item.name).includes(normalizedQuery) ||
        normalizeText(item.description).includes(normalizedQuery);

      if (!matchesQuery) return false;

      const matchesCategory =
        filters.categories.length === 0 || filters.categories.includes(item.category);

      if (!matchesCategory) return false;

      const price = parseFloat(item.price);
      const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];

      if (!matchesPrice) return false;

      return true;
    });

    setTimeout(() => resolve(filteredItems), 150);
  });
};
