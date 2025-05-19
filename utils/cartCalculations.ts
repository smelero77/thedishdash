import { MenuItemData } from '@/types/menu';

export const calculateItemPrice = (item: MenuItemData, modifiers: Record<string, any>) => {
  const basePrice = item.price;
  const modifiersPrice = Object.values(modifiers).reduce((total: number, modifier: any) => {
    return (
      total +
      modifier.options.reduce((sum: number, option: any) => sum + (option.extra_price || 0), 0)
    );
  }, 0);
  return basePrice + modifiersPrice;
};

export const calculateCartTotal = (cart: Record<string, any>) => {
  return Object.values(cart).reduce((total: number, item: any) => {
    return total + calculateItemPrice(item.item, item.modifiers) * item.quantity;
  }, 0);
};
