import { MenuItemData } from '@/types/menu';
import { SearchFilters } from '../hooks/useSearchFilters';

const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
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
      // Filtro por texto
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(item.name).includes(normalizedQuery) ||
        normalizeText(item.description).includes(normalizedQuery);

      if (!matchesQuery) return false;

      // Filtro por categorías
      if (filters.categories.length > 0) {
        const matchesCategory = item.category_ids.some((id) => filters.categories.includes(id));
        if (!matchesCategory) return false;
      }

      // Filtro por precio
      const [minPrice, maxPrice] = filters.priceRange;
      const price = item.price;
      const matchesPrice = price >= minPrice && price <= maxPrice;
      if (!matchesPrice) return false;

      return true;
    });

    setTimeout(() => resolve(filteredItems), 150);
  });
};
