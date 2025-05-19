import { MenuItemData } from '@/types/menu';

export const searchMenuItems = (query: string, menuItems: MenuItemData[]) => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];

  return menuItems.filter((item) => {
    // Si algún campo es null/undefined, lo convertimos a ''
    const name = item.name ?? '';
    const description = item.description ?? '';
    const foodInfo = item.food_info ?? '';
    const origin = item.origin ?? '';
    const pairing = item.pairing_suggestion ?? '';
    const notes = item.chef_notes ?? '';

    return (
      name.toLowerCase().includes(searchTerm) ||
      description.toLowerCase().includes(searchTerm) ||
      foodInfo.toLowerCase().includes(searchTerm) ||
      origin.toLowerCase().includes(searchTerm) ||
      pairing.toLowerCase().includes(searchTerm) ||
      notes.toLowerCase().includes(searchTerm)
    );
  });
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
