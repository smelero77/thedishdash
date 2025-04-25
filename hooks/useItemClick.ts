import { MenuItemData } from '@/types/menu';
import { Modifier } from '@/types/modifiers';

export const useItemClick = ({
  menuItems,
  fetchModifiers,
  setSelectedItem,
  setShowModifierModal,
  handleAddToCart
}: {
  menuItems: MenuItemData[];
  fetchModifiers: (itemId: string) => Promise<void>;
  setSelectedItem: React.Dispatch<React.SetStateAction<{ id: string; name: string; description: string; allergens: any[]; modifiers: Modifier[] } | null>>;
  setShowModifierModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddToCart: (itemId: string) => void;
}) => {
  return async (itemId: string) => {
    const item = menuItems.find((i: MenuItemData) => i.id === itemId);
    if (!item) return;

    if (item.modifiers?.length) {
      await fetchModifiers(itemId);
      setSelectedItem({
        id: item.id,
        name: item.name,
        description: item.description,
        allergens: item.allergens,
        modifiers: item.modifiers
      });
      setShowModifierModal(true);
    } else {
      handleAddToCart(itemId);
    }
  };
}; 