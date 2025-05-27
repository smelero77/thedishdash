import { MenuItemData } from '@/types/menu';
import Fuse from 'fuse.js';
import { FUSE_OPTIONS } from './searchConfig';

let fuseInstance: Fuse<MenuItemData> | null = null;

export const initializeFuseSearch = (menuItems: MenuItemData[]) => {
  fuseInstance = new Fuse(menuItems, FUSE_OPTIONS);
};

export const searchMenuItems = (query: string, menuItems: MenuItemData[]) => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm || searchTerm.length < FUSE_OPTIONS.minMatchCharLength) return [];

  // Siempre crear una nueva instancia de Fuse para asegurar resultados actualizados
  initializeFuseSearch(menuItems);

  if (!fuseInstance) return [];

  // Realizar la búsqueda
  const results = fuseInstance.search(searchTerm);

  // Devolver los items ordenados por relevancia
  return results.map((result) => result.item);
};

export const resetSearch = (
  setSearchQuery: (q: string) => void,
  setFilteredItems: (items: MenuItemData[]) => void,
  setSearchActive: (active: boolean) => void,
) => {
  setSearchQuery('');
  setFilteredItems([]);
  setSearchActive(false);
};
