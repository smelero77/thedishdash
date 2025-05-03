import { MenuItemData } from '@/types/menu';

export const normalizeModifiers = (modifiers: Record<string, any> | null) => {
  if (!modifiers || Object.keys(modifiers).length === 0) {
    return null;
  }
  return modifiers;
};

export const getCartKey = (itemId: string, modifiers: Record<string, any> | null) => {
  const normalizedModifiers = normalizeModifiers(modifiers);
  return `${itemId}${normalizedModifiers ? `-${JSON.stringify(normalizedModifiers)}` : ''}`;
};

export const transformCartItem = (item: MenuItemData, modifiers: Record<string, any> | null) => {
  return {
    item,
    modifiers: normalizeModifiers(modifiers),
    quantity: 1
  };
}; 