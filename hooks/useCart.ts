import { useState, useCallback } from 'react';
import { MenuItemData, Cart, CartItem } from '@/types/menu';

function useCart(menuItems: MenuItemData[], currentClientAlias?: string) {
  const [cart, setCart] = useState<Cart>({});
  const [cartTotal, setCartTotal] = useState<number>(0);

  // Función para generar cartKey
  const getCartKey = useCallback((itemId: string, modifiers: Record<string, any> = {}) => {
    // Ordenar los modificadores para asegurar que generamos la misma clave
    // independientemente del orden en que se seleccionaron
    const orderedModifiers: Record<string, any> = {};
    
    console.log('[useCart] Generating cart key for item:', itemId);
    console.log('[useCart] Original modifiers:', JSON.stringify(modifiers));
    
    // Ordenar las claves (IDs de los modificadores)
    const sortedModifierIds = Object.keys(modifiers).sort();
    
    // Crear un nuevo objeto con los modificadores ordenados
    sortedModifierIds.forEach(modifierId => {
      const modifier = modifiers[modifierId];
      
      // Ordenar también las opciones dentro de cada modificador
      if (modifier && modifier.options && Array.isArray(modifier.options)) {
        // Crear una copia con las opciones ordenadas por ID
        orderedModifiers[modifierId] = {
          ...modifier,
          options: [...modifier.options].sort((a, b) => 
            (a.id && b.id) ? a.id.localeCompare(b.id) : 0
          )
        };
      } else {
        // Si no hay opciones o no es un array, simplemente copiar
        orderedModifiers[modifierId] = modifier;
      }
    });
    
    console.log('[useCart] Ordered modifiers:', JSON.stringify(orderedModifiers));
    
    const cartKey = `${itemId}-${JSON.stringify(orderedModifiers)}`;
    console.log('[useCart] Generated cart key:', cartKey);
    
    return cartKey;
  }, []);

  // Función para buscar cartKey por itemId
  const findCartKey = useCallback((itemId: string) => {
    return Object.keys(cart).find(key => key.startsWith(`${itemId}-`));
  }, [cart]);

  // Función para buscar cartKey exacto (itemId + modificadores específicos)
  const findExactCartKey = useCallback((itemId: string, modifiers: Record<string, any>) => {
    const targetKey = getCartKey(itemId, modifiers);
    return cart[targetKey] ? targetKey : undefined;
  }, [cart, getCartKey]);

  // Calcular precio total de un item (incluyendo modificadores)
  const calculateItemPrice = useCallback((item: MenuItemData, modifiers: Record<string, any>) => {
    const basePrice = item.price;
    const modifiersPrice = Object.values(modifiers).reduce((total: number, modifier: any) => {
      return total + modifier.options.reduce((sum: number, option: any) => sum + (option.extra_price || 0), 0);
    }, 0);
    return basePrice + modifiersPrice;
  }, []);

  // Añadir al carrito
  const handleAddToCart = useCallback((itemId: string, modifiers: Record<string, any> = {}) => {
    console.log('[useCart] Adding to cart:', { itemId, modifiers });
    
    const cartKey = getCartKey(itemId, modifiers);
    const existingItem = cart[cartKey];

    if (existingItem) {
      setCart((prev: Cart) => ({
        ...prev,
        [cartKey]: {
          ...existingItem,
          quantity: existingItem.quantity + 1
        }
      }));
    } else {
      const item = menuItems.find((item: MenuItemData) => item.id === itemId);
      if (!item) {
        console.error('[useCart] Item not found:', itemId);
        return;
      }

      setCart((prev: Cart) => ({
        ...prev,
        [cartKey]: {
          id: itemId,
          quantity: 1,
          modifiers,
          item,
          client_alias: currentClientAlias
        }
      }));
    }

    // Actualizar el total del carrito
    const item = menuItems.find((item: MenuItemData) => item.id === itemId);
    if (item) {
      const price = calculateItemPrice(item, modifiers);
      setCartTotal(prev => prev + price);
    }
  }, [cart, menuItems, currentClientAlias, getCartKey, calculateItemPrice]);

  // Remover del carrito usando itemId y modifiers
  const handleRemoveFromCartByItem = useCallback((itemId: string, modifiers: Record<string, any>) => {
    console.log('[useCart] Removing from cart by item:', { itemId, modifiers });
    
    const cartKey = getCartKey(itemId, modifiers);
    const item = cart[cartKey];
    
    if (!item) {
      console.error('[useCart] Item not found in cart:', { itemId, modifiers });
      return;
    }
    
    const price = calculateItemPrice(item.item, modifiers);
    handleRemoveFromCartByKey(cartKey, price);
  }, [cart, getCartKey, calculateItemPrice]);

  // Remover del carrito usando cartKey directamente
  const handleRemoveFromCartByKey = useCallback((cartKey: string, price: number) => {
    console.log('[useCart] Función handleRemoveFromCartByKey llamada con:', { cartKey, price });
    
    if (!cartKey) {
      console.error('[useCart] Cannot remove item: cartKey is undefined or empty');
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      console.error('[useCart] ERROR: Cannot remove item: price is invalid:', price);
      return;
    }
    
    const item = cart[cartKey];
    if (!item) {
      console.error('[useCart] Item not found in cart for key:', cartKey);
      return;
    }

    console.log('[useCart] Current item in cart:', {
      item: item.item.name,
      quantity: item.quantity,
      price,
      cartKey
    });

    setCart((prevCart: Cart) => {
      const newCount = (prevCart[cartKey]?.quantity || 0) - 1;
      console.log('[useCart] New count will be:', newCount);

      let newCart;
      
      if (newCount <= 0) {
        console.log('[useCart] Removing item completely from cart');
        const { [cartKey]: _, ...rest } = prevCart;
        newCart = rest;
      } else {
        console.log('[useCart] Decreasing item quantity in cart');
        newCart = {
          ...prevCart,
          [cartKey]: { ...prevCart[cartKey], quantity: newCount }
        };
      }
      
      // Usando setTimeout para loguear el nuevo estado después de que React haya actualizado el estado
      setTimeout(() => {
        console.log('[useCart] Estado del carrito actualizado:', {
          totalItems: Object.values(newCart).reduce((sum, { quantity }) => sum + quantity, 0),
          numItems: Object.keys(newCart).length,
          removido: newCount <= 0 ? 'completamente' : 'decrementado'
        });
      }, 0);
      
      return newCart;
    });

    setCartTotal((prev: number) => {
      const newTotal = Math.max(0, prev - price);
      console.log('[useCart] New cart total:', newTotal);
      return newTotal;
    });
    
    console.log('[useCart] Cart update complete');
  }, [cart]);

  // Obtener cantidad total de items en el carrito
  const getTotalItems = useCallback(() => {
    return Object.values(cart).reduce((sum: number, { quantity }: CartItem) => sum + quantity, 0);
  }, [cart]);

  // Obtener cantidad de un item específico (sumando todas sus variantes)
  const getItemQuantity = useCallback((itemId: string) => {
    let quantity = 0;
    Object.entries(cart).forEach(([key, item]) => {
      if (key.startsWith(`${itemId}-`)) {
        quantity += item.quantity;
      }
    });
    return quantity;
  }, [cart]);

  return {
    cart,
    cartTotal,
    handleAddToCart,
    handleRemoveFromCartByItem,
    handleRemoveFromCartByKey,
    getTotalItems,
    getItemQuantity,
    findCartKey,
    findExactCartKey,
    getCartKey,
    calculateItemPrice,
    setCart
  };
}

export default useCart; 