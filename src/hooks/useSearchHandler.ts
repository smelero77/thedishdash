import { useState, useEffect } from 'react';
import { MenuItemData } from '@/types/menu';
import { searchMenuItems } from '@/utils/searchUtils';
import { SearchFilters } from './useSearchFilters';

export const useSearchHandler = (initialMenuItems: MenuItemData[], filters: SearchFilters) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<MenuItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim() !== '') {
      setIsLoading(true);
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      setError(null);
      try {
        const searchResults = await searchMenuItems(initialMenuItems, debouncedQuery, filters);
        setResults(searchResults);
      } catch (e) {
        setError('Ocurrió un error al realizar la búsqueda.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    performSearch();
  }, [debouncedQuery, filters, initialMenuItems]);

  return { query, setQuery, results, isLoading, error };
};
