import { Cart, CartItem } from '@/types/cart';
import { MenuItemData } from '@/types/menu';
import { ModifierSelection, SelectedModifiers } from '@/types/modifiers';

/**
 * Obtiene la cantidad total de un ítem específico en el carrito
 * @param cart - El carrito actual
 * @param itemId - ID del ítem a buscar
 * @returns Cantidad total del ítem en el carrito
 */
export const getCartQuantityForItem = (cart: Cart, itemId: string): number => {
  let quantity = 0;
  Object.entries(cart).forEach(([key, item]) => {
    if (key.startsWith(`${itemId}-`)) {
      quantity += item.quantity;
    }
  });
  return quantity;
};

/**
 * Encuentra la clave de carrito para un ítem específico
 * @param cart - El carrito actual
 * @param itemId - ID del ítem a buscar
 * @returns La primera clave encontrada o undefined si no existe
 */
export const getFirstCartKeyForItem = (cart: Cart, itemId: string): string | undefined => {
  const entries = Object.entries(cart).filter(([key]) => key.startsWith(`${itemId}-`));
  return entries.length > 0 ? entries[0][0] : undefined;
};

/**
 * Maneja la eliminación de un ítem del carrito
 * @param cart - El carrito actual
 * @param itemId - ID del ítem a eliminar o el cartKey completo
 * @param onRemoveItem - Función callback para eliminar el ítem
 * @param componentName - Nombre del componente que llama a esta función (para logs)
 */
export const removeFromCart = (
  cart: Cart,
  itemId: string,
  onRemoveItem: (cartKey: string) => void,
  componentName: string = 'CartUtil',
): void => {
  console.log(`[${componentName}] Attempting to remove item:`, itemId);
  console.log(`[${componentName}] Available cart keys:`, Object.keys(cart));

  // Verificar si la clave exacta existe en el carrito
  if (cart[itemId]) {
    const itemDetails = cart[itemId];
    console.log(`[${componentName}] Item found with exact key, removing:`, {
      key: itemId,
      name: itemDetails.item.name,
      quantity: itemDetails.quantity,
    });
    onRemoveItem(itemId);
    return;
  }

  // Si no se encuentra con la clave exacta, buscar de manera menos estricta
  // Extraer el ID del ítem (parte antes del primer guión)
  const itemIdPart = itemId.split('-')[0];
  console.log(`[${componentName}] Looking for item with ID:`, itemIdPart);

  // Buscar cualquier clave que comience con ese ID
  const cartKey = Object.keys(cart).find((key) => key.startsWith(`${itemIdPart}-`));

  if (cartKey) {
    const itemDetails = cart[cartKey];
    console.log(`[${componentName}] Found matching item with key:`, {
      key: cartKey,
      name: itemDetails.item.name,
      quantity: itemDetails.quantity,
    });
    onRemoveItem(cartKey);
    return;
  }

  // Si no se encuentra ninguna coincidencia, buscar coincidencia parcial en el JSON
  console.log(`[${componentName}] Trying partial match for complex key...`);
  for (const key of Object.keys(cart)) {
    // Verificar si contiene el mismo conjunto de IDs de opciones
    if (key.includes(itemId) || itemId.includes(key)) {
      const itemDetails = cart[key];
      console.log(`[${componentName}] Found partial match:`, {
        key,
        name: itemDetails.item.name,
        quantity: itemDetails.quantity,
      });
      onRemoveItem(key);
      return;
    }
  }

  console.error(`[${componentName}] No cart key found for item:`, itemId);
};

/**
 * Calcula el precio total de un ítem, incluyendo los modificadores y multiplicado por la cantidad
 * @param item - El ítem del carrito
 * @param menuItem - Los datos del ítem del menú
 * @returns Precio total (precio base + modificadores) * cantidad
 */
export const getItemTotalPrice = (item: CartItem, menuItem: MenuItemData): number => {
  const basePrice = menuItem.price;
  const modifiersPrice = Object.values(item.modifiers).reduce(
    (total: number, modifier: SelectedModifiers) => {
      const optionsPrice = Object.values(modifier).reduce((sum: number, mod) => {
        return sum + mod.options.reduce((optSum: number, option) => optSum + option.extra_price, 0);
      }, 0);
      return total + optionsPrice;
    },
    0,
  );
  return (basePrice + modifiersPrice) * item.quantity;
};
