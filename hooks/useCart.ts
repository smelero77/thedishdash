import { useState, useCallback, useEffect } from 'react';
import { MenuItemData, Cart, CartItem } from '@/types/menu';
import { supabase } from '@/lib/supabase';

// Función para inicializar el carrito colaborativo obteniendo o creando el temporary_order_id
export async function initializeCart(tableNumber: number): Promise<string> {
  console.log('[initializeCart] Llamando a get_or_create_order con tableNumber:', tableNumber);
  const { data, error } = await supabase.rpc('get_or_create_order', {
    p_table_number: tableNumber,
  });
  console.log('[initializeCart] Respuesta de Supabase:', { data, error });
  if (error || !data) {
    console.error('[initializeCart] Error al obtener temporary_order_id:', error);
    throw error || new Error('No se pudo obtener el temporary_order_id');
  }
  return data as string;
}

// Añadir o incrementar un producto en el carrito colaborativo
export async function addOrIncrementCartItem(
  temporaryOrderId: string,
  menuItemId: string,
  modifiers: any,
  alias: string,
): Promise<void> {
  const { error } = await supabase.rpc('increment_item', {
    p_order_id: temporaryOrderId,
    p_menu_item_id: menuItemId,
    p_modifiers: modifiers,
    p_alias: alias,
  });
  if (error) {
    throw error;
  }
}

// Decrementar o eliminar un producto del carrito colaborativo
export async function decrementOrDeleteCartItem(
  temporaryOrderId: string,
  menuItemId: string,
  modifiers: any,
  alias: string,
): Promise<void> {
  const { error } = await supabase.rpc('decrement_item', {
    p_order_id: temporaryOrderId,
    p_menu_item_id: menuItemId,
    p_modifiers: modifiers,
    p_alias: alias,
  });
  if (error) {
    throw error;
  }
}

function useCart(menuItems: MenuItemData[], currentClientAlias: string, tableNumber: number) {
  console.log('[useCart] Inicializando con tableNumber:', tableNumber);
  const [cart, setCart] = useState<Cart>({});
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [temporaryOrderId, setTemporaryOrderId] = useState<string>('');

  // Inicializar el temporaryOrderId cuando se monta el componente
  useEffect(() => {
    console.log('[useCart] useEffect triggered with tableNumber:', tableNumber);
    if (!tableNumber) {
      console.log('[useCart] No table number provided, skipping initialization');
      return;
    }

    console.log('[useCart] Llamando a initializeCart con tableNumber:', tableNumber);
    initializeCart(tableNumber)
      .then((id) => {
        console.log('[useCart] Temporary order ID obtenido:', id);
        setTemporaryOrderId(id);
      })
      .catch((error) => {
        console.error('[useCart] Error al inicializar carrito:', error);
      });
  }, [tableNumber]);

  // Sincronización en tiempo real con Supabase
  useEffect(() => {
    const channel = supabase
      .channel('public:temporary_order_items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'temporary_order_items',
        },
        (payload) => {
          console.log('[useCart] Cambio en tiempo real:', payload);

          // Actualizar el carrito local según el cambio recibido
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newItem = payload.new;
            const item = menuItems.find((item) => item.id === newItem.menu_item_id);

            if (item) {
              const cartKey = `${newItem.menu_item_id}-${JSON.stringify(newItem.modifiers_data)}`;

              setCart((prev) => ({
                ...prev,
                [cartKey]: {
                  id: newItem.menu_item_id,
                  quantity: newItem.quantity,
                  modifiers: newItem.modifiers_data,
                  item,
                  client_alias: newItem.alias,
                },
              }));
            }
          } else if (payload.eventType === 'DELETE') {
            const oldItem = payload.old;
            const cartKey = `${oldItem.menu_item_id}-${JSON.stringify(oldItem.modifiers_data)}`;

            setCart((prev) => {
              const { [cartKey]: _, ...rest } = prev;
              return rest;
            });
          }
        },
      )
      .subscribe();

    // Limpiar la suscripción al desmontar el componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, [menuItems]);

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
    sortedModifierIds.forEach((modifierId) => {
      const modifier = modifiers[modifierId];

      // Ordenar también las opciones dentro de cada modificador
      if (modifier && modifier.options && Array.isArray(modifier.options)) {
        // Crear una copia con las opciones ordenadas por ID
        orderedModifiers[modifierId] = {
          ...modifier,
          options: [...modifier.options].sort((a, b) =>
            a.id && b.id ? a.id.localeCompare(b.id) : 0,
          ),
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
  const findCartKey = useCallback(
    (itemId: string) => {
      return Object.keys(cart).find((key) => key.startsWith(`${itemId}-`));
    },
    [cart],
  );

  // Función para buscar cartKey exacto (itemId + modificadores específicos)
  const findExactCartKey = useCallback(
    (itemId: string, modifiers: Record<string, any>) => {
      const targetKey = getCartKey(itemId, modifiers);
      return cart[targetKey] ? targetKey : undefined;
    },
    [cart, getCartKey],
  );

  // Calcular precio total de un item (incluyendo modificadores)
  const calculateItemPrice = useCallback((item: MenuItemData, modifiers: Record<string, any>) => {
    const basePrice = item.price;
    const modifiersPrice = Object.values(modifiers).reduce((total: number, modifier: any) => {
      return (
        total +
        modifier.options.reduce((sum: number, option: any) => sum + (option.extra_price || 0), 0)
      );
    }, 0);
    return basePrice + modifiersPrice;
  }, []);

  // Añadir al carrito
  const handleAddToCart = useCallback(
    async (itemId: string, modifiers: Record<string, any> = {}) => {
      console.log('[useCart] Adding to cart:', { itemId, modifiers });

      const cartKey = getCartKey(itemId, modifiers);
      const existingItem = cart[cartKey];

      try {
        // Llamar a la función de base de datos
        await addOrIncrementCartItem(
          temporaryOrderId, // Necesitamos obtener este ID de alguna parte
          itemId,
          modifiers,
          currentClientAlias || 'guest',
        );

        // Actualizar el estado local
        if (existingItem) {
          setCart((prev: Cart) => ({
            ...prev,
            [cartKey]: {
              ...existingItem,
              quantity: existingItem.quantity + 1,
            },
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
              client_alias: currentClientAlias,
            },
          }));
        }

        // Actualizar el total del carrito
        const item = menuItems.find((item: MenuItemData) => item.id === itemId);
        if (item) {
          const price = calculateItemPrice(item, modifiers);
          setCartTotal((prev) => prev + price);
        }
      } catch (error) {
        console.error('[useCart] Error adding to cart:', error);
        // Podríamos mostrar un mensaje de error al usuario aquí
      }
    },
    [cart, menuItems, currentClientAlias, getCartKey, calculateItemPrice, temporaryOrderId],
  );

  // Remover del carrito usando itemId y modifiers
  const handleRemoveFromCartByItem = useCallback(
    async (itemId: string, modifiers: Record<string, any>) => {
      console.log('[useCart] Removing from cart by item:', { itemId, modifiers });

      const cartKey = getCartKey(itemId, modifiers);
      const item = cart[cartKey];

      if (!item) {
        console.error('[useCart] Item not found in cart:', { itemId, modifiers });
        return;
      }

      try {
        // Llamar a la función de base de datos
        await decrementOrDeleteCartItem(
          temporaryOrderId,
          itemId,
          modifiers,
          currentClientAlias || 'guest',
        );

        // Actualizar el estado local
        const price = calculateItemPrice(item.item, modifiers);
        handleRemoveFromCartByKey(cartKey, price);
      } catch (error) {
        console.error('[useCart] Error removing from cart:', error);
        // Podríamos mostrar un mensaje de error al usuario aquí
      }
    },
    [cart, getCartKey, calculateItemPrice, temporaryOrderId, currentClientAlias],
  );

  // Remover del carrito usando cartKey directamente
  const handleRemoveFromCartByKey = useCallback(
    (cartKey: string, price: number) => {
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
        cartKey,
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
            [cartKey]: { ...prevCart[cartKey], quantity: newCount },
          };
        }

        // Usando setTimeout para loguear el nuevo estado después de que React haya actualizado el estado
        setTimeout(() => {
          console.log('[useCart] Estado del carrito actualizado:', {
            totalItems: Object.values(newCart).reduce((sum, { quantity }) => sum + quantity, 0),
            numItems: Object.keys(newCart).length,
            removido: newCount <= 0 ? 'completamente' : 'decrementado',
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
    },
    [cart],
  );

  // Obtener cantidad total de items en el carrito
  const getTotalItems = useCallback(() => {
    return Object.values(cart).reduce((sum: number, { quantity }: CartItem) => sum + quantity, 0);
  }, [cart]);

  // Obtener cantidad de un item específico (sumando todas sus variantes)
  const getItemQuantity = useCallback(
    (itemId: string) => {
      let quantity = 0;
      Object.entries(cart).forEach(([key, item]) => {
        if (key.startsWith(`${itemId}-`)) {
          quantity += item.quantity;
        }
      });
      return quantity;
    },
    [cart],
  );

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
    setCart,
  };
}

export default useCart;
