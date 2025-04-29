import { useState, useCallback, useEffect } from 'react';
import { MenuItemData, Cart, CartItem } from '@/types/menu';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define tipos para el payload que esperamos
type TemporaryOrderItem = {
  temporary_order_id: string;
  menu_item_id: string;
  quantity: number;
  modifiers_data: any; // Asegúrate de que este tipo sea correcto y consistente con tu DB
  alias: string;
  created_at: string; // Añadir si existe en tu tabla
  updated_at: string; // Añadir si existe en tu tabla
};

// Función para inicializar el carrito colaborativo obteniendo o creando el temporary_order_id
export async function initializeCart(tableNumber: number): Promise<string> {
  console.log('[initializeCart] Llamando a get_or_create_order con tableNumber:', tableNumber);
  const { data, error } = await supabase.rpc('get_or_create_order', {
    p_table_number: tableNumber,
  });
  console.log('[initializeCart] Respuesta de Supabase:', { data, error });
  if (error || !data) {
    console.error('[initializeCart] Error al obtener temporary_order_id:', error);
    // Considerar manejar este error de forma más amigable en la UI
    throw error || new Error('No se pudo obtener el temporary_order_id');
  }
  // Asegúrate de que el dato retornado es del tipo esperado
  return data as string;
}

// Añadir o incrementar un producto en el carrito colaborativo (llama a la RPC)
export async function addOrIncrementCartItem(
  temporaryOrderId: string,
  menuItemId: string,
  modifiers: any,
  alias: string,
): Promise<void> {
  console.log('[addOrIncrementCartItem] Llamando a increment_item', { temporaryOrderId, menuItemId, alias, modifiers });
  const { error } = await supabase.rpc('increment_item', {
    p_order_id: temporaryOrderId,
    p_menu_item_id: menuItemId,
    p_modifiers: modifiers,
    p_alias: alias,
  });
  if (error) {
    console.error('[addOrIncrementCartItem] Error en increment_item:', error);
    throw error;
  }
  console.log('[addOrIncrementCartItem] RPC increment_item exitosa.');
}

// Decrementar o eliminar un producto del carrito colaborativo (llama a la RPC)
export async function decrementOrDeleteCartItem(
  temporaryOrderId: string,
  menuItemId: string,
  modifiers: any,
  alias: string,
): Promise<void> {
  console.log('[decrementOrDeleteCartItem] Llamando a decrement_item', { temporaryOrderId, menuItemId, alias, modifiers });
  const { error } = await supabase.rpc('decrement_item', {
    p_order_id: temporaryOrderId,
    p_menu_item_id: menuItemId,
    p_modifiers: modifiers,
    p_alias: alias,
  });
  if (error) {
    console.error('[decrementOrDeleteCartItem] Error en decrement_item:', error);
    throw error;
  }
  console.log('[decrementOrDeleteCartItem] RPC decrement_item exitosa.');
}

function useCart(menuItems: MenuItemData[], currentClientAlias: string, tableNumber: number) {
  console.log('[useCart] Inicializando con tableNumber:', tableNumber);
  const [cart, setCart] = useState<Cart>({});
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [temporaryOrderId, setTemporaryOrderId] = useState<string>('');
  // No usamos isLoading para las actualizaciones realtime, solo para la carga inicial si se necesitara un indicador.

  // Función para generar cartKey (crucial para identificar ítems con modificadores)
  const getCartKey = useCallback((itemId: string, modifiers: Record<string, any> = {}) => {
    const orderedModifiers: Record<string, any> = {};
    const sortedModifierIds = Object.keys(modifiers).sort();

    sortedModifierIds.forEach((modifierId) => {
      const modifier = modifiers[modifierId];

      if (modifier && modifier.options && Array.isArray(modifier.options)) {
        orderedModifiers[modifierId] = {
          ...modifier,
          options: [...modifier.options].sort((a, b) =>
             a.id && b.id ? String(a.id).localeCompare(String(b.id)) : 0
          ),
        };
      } else {
        orderedModifiers[modifierId] = modifier;
      }
    });

    const cartKey = `${itemId}-${JSON.stringify(orderedModifiers)}`;
    // console.log('[getCartKey] Generated cart key:', cartKey); // Logging ruidoso, descomentar si es necesario para depurar la key
    return cartKey;
  }, []);

  // Calcular precio total de un item (incluyendo modificadores)
  const calculateItemPrice = useCallback((item: MenuItemData, modifiers: Record<string, any>) => {
    const basePrice = item.price;
    const modifiersPrice = Object.values(modifiers).reduce((total: number, modifier: any) => {
      if (modifier && modifier.options && Array.isArray(modifier.options)) {
        return total + modifier.options.reduce((sum: number, option: any) => sum + (option.extra_price || 0), 0);
      }
      return total;
    }, 0);
    return basePrice + modifiersPrice;
  }, []);

   // Función para recalcular el total del carrito
   const updateCartTotal = useCallback((currentCart: Cart, menuItemsData: MenuItemData[]) => {
        console.log('[updateCartTotal] Recalculando total para carrito:', Object.keys(currentCart).length, 'ítems únicos');
        const newTotal = Object.values(currentCart).reduce((sum, cartItem) => {
            const menuItem = menuItemsData.find(m => m.id === cartItem.id);
            if (!menuItem) {
                console.warn(`[updateCartTotal] MenuItemData not found for ID: ${cartItem.id}. Skipping price calculation for this item.`);
                return sum;
            }
            const itemPrice = calculateItemPrice(menuItem, cartItem.modifiers);
             // console.log(`[updateCartTotal] Item: ${menuItem.name}, Quantity: ${cartItem.quantity}, Price: ${itemPrice}, Subtotal: ${itemPrice * cartItem.quantity}`);
            return sum + (itemPrice * cartItem.quantity);
        }, 0);
        console.log('[updateCartTotal] Nuevo total calculado:', newTotal);
        setCartTotal(newTotal);
    }, [calculateItemPrice]);


  // Efecto para inicializar el temporaryOrderId y cargar el carrito inicial
  useEffect(() => {
    console.log('[useCart: InitEffect] triggered with tableNumber:', tableNumber);
    if (!tableNumber) {
      console.log('[useCart: InitEffect] No table number provided, skipping initialization');
      return;
    }

    console.log('[useCart: InitEffect] Llamando a initializeCart con tableNumber:', tableNumber);
    initializeCart(tableNumber)
      .then(async (id) => {
        console.log('[useCart: InitEffect] Temporary order ID obtenido:', id);
        setTemporaryOrderId(id);

        // Cargar items existentes del carrito
        const { data: items, error } = await supabase
          .from('temporary_order_items')
          .select('*')
          .eq('temporary_order_id', id);

        if (error) {
          console.error('[useCart: InitEffect] Error al cargar items del carrito:', error);
          return;
        }

        console.log('[useCart: InitEffect] Items cargados desde la DB:', items);

        // Construir el estado del carrito con los items existentes
        const initialCartState: Cart = {};
        items?.forEach((item) => {
          const menuItem = menuItems.find((m) => m.id === item.menu_item_id);
          if (menuItem) {
            const cartKey = getCartKey(item.menu_item_id, item.modifiers_data);
            initialCartState[cartKey] = {
              id: item.menu_item_id,
              quantity: item.quantity,
              modifiers: item.modifiers_data,
              item: menuItem, // Guardamos el objeto MenuItemData completo
              client_alias: item.alias,
            };
          } else {
             console.warn(`[useCart: InitEffect] MenuItemData not found for initial item ID: ${item.menu_item_id}. Item will not be added to cart state.`);
          }
        });

        console.log('[useCart: InitEffect] Estado inicial del carrito construido:', initialCartState);
        setCart(initialCartState);
        updateCartTotal(initialCartState, menuItems); // Calcular total inicial
      })
      .catch((error) => {
        console.error('[useCart: InitEffect] Error al inicializar carrito:', error);
      });
  }, [tableNumber, menuItems, getCartKey, updateCartTotal]);


  // Efecto para la sincronización en tiempo real con Supabase
  useEffect(() => {
    console.log('[useCart: RealtimeEffect] triggered. temporaryOrderId:', temporaryOrderId);
    if (!temporaryOrderId) {
      console.log('[useCart: RealtimeEffect] No temporaryOrderId, no se inicia la suscripción.');
      return;
    }

    console.log('[useCart: RealtimeEffect] Iniciando suscripción con temporaryOrderId:', temporaryOrderId);

    const handleRealtimeChanges = (
      payload: RealtimePostgresChangesPayload<{
        [key: string]: any;
      }>,
    ) => {
      // === 1. Verificar que se recibe el payload ===
      console.log('[useCart: RealtimeEffect] Payload recibido:', payload);
      console.log('[useCart: RealtimeEffect] Event type:', payload.eventType);


      const item = (payload.eventType === 'DELETE' ? payload.old : payload.new) as TemporaryOrderItem | null;

      if (!item) {
        console.warn('[useCart: RealtimeEffect] Payload received but no item data found (new or old).');
        return;
      }

      // === 2. Verificar que el filtro de orden pasa ===
      console.log(`[useCart: RealtimeEffect] Payload temporary_order_id: ${item.temporary_order_id}, Hook temporaryOrderId: ${temporaryOrderId}`);
      if (item.temporary_order_id !== temporaryOrderId) {
        console.log('[useCart: RealtimeEffect] Cambio ignorado: pertenece a otra orden.');
        return;
      }
      console.log('[useCart: RealtimeEffect] Filtro de orden pasado.');


      // === 3. Verificar que la clave del carrito se genera correctamente desde el payload ===
      const cartKey = getCartKey(item.menu_item_id, item.modifiers_data);
      console.log('[useCart: RealtimeEffect] Procesando cambio para cartKey:', cartKey, 'Evento:', payload.eventType);
      console.log('[useCart: RealtimeEffect] Datos relevantes del item del payload:', {
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          modifiers_data: item.modifiers_data,
          alias: item.alias
      });


      // Usamos la forma funcional de setCart para asegurar que trabajamos con el estado más reciente
      setCart(prevCart => {
        // === 4. Verificar el estado previo del carrito ===
        console.log('[useCart: RealtimeEffect] Dentro de setCart callback. Número de ítems únicos en estado previo:', Object.keys(prevCart).length);
         if (prevCart[cartKey]) {
            console.log('[useCart: RealtimeEffect] Item con cartKey EXISTE en estado previo:', { quantity: prevCart[cartKey].quantity, alias: prevCart[cartKey].client_alias });
         } else {
            console.log('[useCart: RealtimeEffect] Item con cartKey NO existe en estado previo.');
         }

        const newCart = { ...prevCart }; // Copiar el estado previo
        let itemModified = false; // Bandera para saber si modificamos el carrito de forma que afecte la visualización

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newItem = payload.new as TemporaryOrderItem;
          // === 5. Verificar si se encuentra el MenuItemData ===
          const menuItem = menuItems.find((m) => m.id === newItem.menu_item_id);

          if (!menuItem) {
            console.warn(`[useCart: RealtimeEffect] MenuItemData not found for ID: ${newItem.menu_item_id}. Cannot process update/insert from payload.`);
            console.log('[useCart: RealtimeEffect] No se encontró MenuItemData. Devolviendo estado previo.');
            return prevCart;
          }

          newCart[cartKey] = {
            id: newItem.menu_item_id,
            quantity: newItem.quantity,
            modifiers: newItem.modifiers_data,
            item: menuItem, // Guardar el objeto MenuItemData
            client_alias: newItem.alias,
          };
          itemModified = true;
          console.log(`[useCart: RealtimeEffect] Item ${cartKey} ${payload.eventType === 'INSERT' ? 'añadido' : 'actualizado'}. Nueva cantidad en newCart: ${newCart[cartKey]?.quantity}. Alias: ${newCart[cartKey]?.client_alias}`); // Usar optional chaining por si newCart[cartKey] es undefined justo después

        } else if (payload.eventType === 'DELETE') {
           if (newCart[cartKey]) {
              delete newCart[cartKey];
              itemModified = true;
              console.log(`[useCart: RealtimeEffect] Item ${cartKey} eliminado del newCart.`);
           } else {
              console.log(`[useCart: RealtimeEffect] Item ${cartKey} marcado para eliminar NO encontrado en el estado previo newCart.`);
           }
        }

        // === 6. Verificar si el carrito fue modificado y recalcular total ===
        if (itemModified) {
             console.log('[useCart: RealtimeEffect] Carrito modificado por el evento RT. Recalculando total...');
             updateCartTotal(newCart, menuItems); // Llama a setCartTotal
             console.log('[useCart: RealtimeEffect] Recalculando total completado.');
        } else {
            console.log('[useCart: RealtimeEffect] El evento RT no resultó en una modificación del estado local del carrito (posiblemente item no encontrado o ya eliminado).');
        }

        // === 7. Verificar el estado del carrito que se retorna ===
        console.log('[useCart: RealtimeEffect] Devolviendo nuevo estado del carrito. Número de ítems únicos:', Object.keys(newCart).length);
        return newCart; // Devolver el nuevo estado del carrito
      });
    };

    const channel = supabase
      .channel(`temporary_order_items:${temporaryOrderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'temporary_order_items',
          filter: `temporary_order_id=eq.${temporaryOrderId}` // Asegúrate que RLS permite esto
        },
        handleRealtimeChanges
      )
      .subscribe((status) => {
        // === 8. Verificar el estado de la suscripción ===
        console.log('[useCart: RealtimeEffect] Estado de la suscripción:', status);
        if (status === 'SUBSCRIBED') {
            console.log('[useCart: RealtimeEffect] Suscripción exitosa. Esperando cambios...');
        } else if (status === 'CHANNEL_ERROR') {
            console.error('[useCart: RealtimeEffect] Error en el canal de suscripción. Revisa RLS y permisos.');
        } else if (status === 'TIMED_OUT') {
            console.warn('[useCart: RealtimeEffect] Suscripción al canal ha expirado.');
        } else if (status === 'CLOSED') {
            console.log('[useCart: RealtimeEffect] Canal de suscripción cerrado.');
        }
      });

    return () => {
      console.log('[useCart: RealtimeEffect] Limpiando suscripción para temporaryOrderId:', temporaryOrderId);
      if (channel) {
         supabase.removeChannel(channel);
      }
    };
  }, [temporaryOrderId, menuItems, getCartKey, calculateItemPrice, updateCartTotal]);


  // === Helper functions (operan sobre el estado local o generan datos) ===

  // Función para buscar cartKey por itemId (busca CUALQUIER item con ese ID, ignorando modificadores exactos)
  const findCartKey = useCallback(
    (itemId: string) => {
      console.log('[useCart] findCartKey called for itemId:', itemId);
      // Busca la primera clave en el objeto cart que empieza con `${itemId}-`
      const foundKey = Object.keys(cart).find((key) => key.startsWith(`${itemId}-`));
      console.log('[useCart] findCartKey result:', foundKey);
      return foundKey;
    },
    [cart], // Depende del estado del carrito
  );

  // Función para buscar cartKey exacto (itemId + modificadores específicos)
   const findExactCartKey = useCallback(
      (itemId: string, modifiers: Record<string, any>) => {
          console.log('[useCart] findExactCartKey called for itemId:', itemId, 'modifiers:', modifiers);
          const targetKey = getCartKey(itemId, modifiers); // Genera la key exacta esperada
          const foundKey = cart[targetKey] ? targetKey : undefined; // Busca si esa key existe en el cart
          console.log('[useCart] findExactCartKey result:', foundKey);
          return foundKey;
      },
      [cart, getCartKey], // Dependencias en cart y getCartKey
   );

  // Obtener cantidad total de ítems en el carrito
  const getTotalItems = useCallback(() => {
    console.log('[useCart] getTotalItems called. Current cart keys:', Object.keys(cart).length);
    const total = Object.values(cart).reduce((sum: number, { quantity }: CartItem) => sum + quantity, 0);
    console.log('[useCart] getTotalItems result:', total);
    return total;
  }, [cart]);

  // Obtener cantidad de un ítem específico (sumando todas sus variantes)
  const getItemQuantity = useCallback(
    (itemId: string) => {
      console.log('[useCart] getItemQuantity called for itemId:', itemId);
      let quantity = 0;
      Object.values(cart).forEach(item => {
        if (item && item.id && item.id === itemId) {
           quantity += item.quantity;
        }
      });
       console.log('[useCart] getItemQuantity result:', quantity);
      return quantity;
    },
    [cart],
  );


  // === Handlers de acciones de usuario (solo llaman a la RPC) ===

  const handleAddToCart = useCallback(
    async (itemId: string, modifiers: Record<string, any> = {}) => {
      if (!temporaryOrderId) {
         console.warn('[handleAddToCart] temporaryOrderId no está disponible. No se puede añadir al carrito.');
         return;
      }
      console.log('[handleAddToCart] Calling addOrIncrementCartItem:', { itemId, modifiers, temporaryOrderId, alias: currentClientAlias || 'guest' });
      try {
        await addOrIncrementCartItem(
          temporaryOrderId,
          itemId,
          modifiers,
          currentClientAlias || 'guest',
        );
        console.log('[handleAddToCart] addOrIncrementCartItem success. Awaiting realtime update.');
      } catch (error) {
        console.error('[handleAddToCart] Error calling addOrIncrementCartItem:', error);
        // Manejar error en la UI si es necesario
      }
    },
    [temporaryOrderId, currentClientAlias],
  );

  const handleDecrementCart = useCallback(
    async (itemId: string, modifiers: Record<string, any> = {}) => {
      if (!temporaryOrderId) {
        console.warn('[handleDecrementCart] temporaryOrderId no está disponible. No se puede decrementar.');
        return;
      }
       console.log('[handleDecrementCart] Calling decrementOrDeleteCartItem:', { itemId, modifiers, temporaryOrderId, alias: currentClientAlias || 'guest' });
      try {
        await decrementOrDeleteCartItem(
          temporaryOrderId,
          itemId,
          modifiers,
          currentClientAlias || 'guest',
        );
         console.log('[handleDecrementCart] decrementOrDeleteCartItem success. Awaiting realtime update.');
      } catch (error) {
        console.error('[handleDecrementCart] Error calling decrementOrDeleteCartItem:', error);
        // Manejar error en la UI si es necesario
      }
    },
    [temporaryOrderId, currentClientAlias],
  );

  const handleRemoveFromCartByItem = useCallback(
      async (itemId: string, modifiers: Record<string, any> = {}) => {
          if (!temporaryOrderId) {
              console.warn('[handleRemoveFromCartByItem] temporaryOrderId no está disponible.');
              return;
          }
          console.log('[handleRemoveFromCartByItem] Intentando eliminar un item llamando a decrement_item (esperando DELETE via RT):', { itemId, modifiers, temporaryOrderId, alias: currentClientAlias || 'guest' });
          try {
              await decrementOrDeleteCartItem(
                  temporaryOrderId,
                  itemId,
                  modifiers,
                  currentClientAlias || 'guest',
              );
              console.log('[handleRemoveFromCartByItem] decrement_item llamado para potencial eliminación. Awaiting realtime update.');
          } catch (error) {
              console.error('[handleRemoveFromCartByItem] Error calling decrement_item for removal:', error);
              // Manejar error en la UI si es necesario
          }
      },
      [temporaryOrderId, currentClientAlias],
  );


  const handleRemoveFromCartByKey = useCallback(
      (cartKey: string) => {
          console.warn('[useCart] handleRemoveFromCartByKey no debe usarse para modificar el carrito localmente. Las actualizaciones vienen del real-time.');
          // Si necesitas eliminar un item completamente (todas las unidades) desde la UI
          // Debes implementar una RPC en Supabase que elimine la fila por order_id, item_id y modifiers_data
          // y llamarla aquí.
      },
      []
   );


  return {
    cart,
    cartTotal,
    handleAddToCart,
    handleDecrementCart,
    // handleRemoveFromCartByItem, // Si decrement_item elimina al llegar a 0, este podría ser redundante
    // handleRemoveFromCartByKey, // No usar para modificar localmente
    getTotalItems,
    getItemQuantity,
    findCartKey, // <-- Incluimos de nuevo esta función
    findExactCartKey,
    getCartKey,
    calculateItemPrice,
  };
}

export default useCart;