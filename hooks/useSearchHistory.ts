import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 5;

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Cargar historial al montar el componente
  useEffect(() => {
    const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setSearchHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Error al cargar el historial de búsqueda:', error);
      }
    }
  }, []);

  const addToHistory = (term: string) => {
    if (!term || term.trim().length < 3) return;

    setSearchHistory((prevHistory) => {
      // Filtrar el término actual si ya existe
      const filteredHistory = prevHistory.filter((item) => item !== term);
      // Añadir el nuevo término al principio
      const newHistory = [term, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

      // Guardar en localStorage
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));

      return newHistory;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  return {
    searchHistory,
    addToHistory,
    clearHistory,
  };
}
