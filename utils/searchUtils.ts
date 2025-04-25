import { MenuItemData } from '@/types/menu';

export const searchMenuItems = (query: string, menuItems: MenuItemData[]) => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];

  return menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm) ||
    item.description.toLowerCase().includes(searchTerm) ||
    item.food_info.toLowerCase().includes(searchTerm) ||
    item.origin.toLowerCase().includes(searchTerm) ||
    item.pairing_suggestion.toLowerCase().includes(searchTerm) ||
    item.chef_notes.toLowerCase().includes(searchTerm)
  );
};

export const resetSearch = (setSearchQuery: (query: string) => void, setFilteredItems: (items: MenuItemData[]) => void, setSearchActive: (active: boolean) => void) => {
  setSearchQuery('');
  setFilteredItems([]);
  setSearchActive(false);
}; 