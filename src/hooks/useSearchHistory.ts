import { useState, useCallback } from 'react';

const HISTORY_KEY = 'searchHistory';
const MAX_HISTORY_ITEMS = 5;

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const storedHistory = window.localStorage.getItem(HISTORY_KEY);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error('Error reading history from localStorage', error);
      return [];
    }
  });

  const addToHistory = useCallback((term: string) => {
    if (!term || term.length < 2) return;
    setSearchHistory((prevHistory) => {
      const newHistory = [term, ...prevHistory.filter((t) => t !== term)].slice(
        0,
        MAX_HISTORY_ITEMS,
      );
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error saving history to localStorage', error);
      }
      return newHistory;
    });
  }, []);

  return { searchHistory, addToHistory };
};
