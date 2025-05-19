'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { MenuItemData, Cart, CartItem } from '@/types/menu';
import { CartActions } from '@/types/cart';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getCartKey as getCartKeyFromUtils, normalizeModifiers } from '@/utils/cartTransformers';

// --- Tipos más estrictos ---
export interface SelectedModifierOption {
  id: string;
  name: string;
  extra_price: number;
}

export interface SelectedModifier {
  id: string;
  name: string;
  options: SelectedModifierOption[];
}

export type SelectedModifiers = Record<string, SelectedModifier>;

type TemporaryOrderItem = {
  temporary_order_id: string;
  menu_item_id: string;
  quantity: number;
  modifiers_data: SelectedModifiers | null;
  alias: string;
  created_at: string;
  updated_at: string;
};

// --- Funciones auxiliares ---
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

export async function addOrIncrementCartItem(
  temporaryOrderId: string,
  menuItemId: string,
  modifiers: SelectedModifiers | null,
  alias: string,
): Promise<void> {
  console.log('[addOrIncrementCartItem] Calling increment_item', {
    temporaryOrderId,
    menuItemId,
    alias,
    modifiers,
  });
  const { error } = await supabase.rpc('increment_item', {
    p_order_id: temporaryOrderId,
    p_menu_item_id: menuItemId,
    p_modifiers: modifiers,
    p_alias: alias,
  });
  if (error) {
    console.error('[addOrIncrementCartItem] Error in increment_item:', error);
    throw error;
  }
  console.log('[addOrIncrementCartItem] RPC increment_item successful.');
}

export async function decrementOrDeleteCartItem(
  temporaryOrderId: string,
  menuItemId: string,
  modifiers: SelectedModifiers | null,
  alias: string,
): Promise<void> {
  console.log('[decrementOrDeleteCartItem] Calling decrement_item', {
    temporaryOrderId,
    menuItemId,
    alias,
    modifiers,
  });
  const { error } = await supabase.rpc('decrement_item', {
    p_order_id: temporaryOrderId,
    p_menu_item_id: menuItemId,
    p_modifiers: modifiers,
    p_alias: alias,
  });
  if (error) {
    console.error('[decrementOrDeleteCartItem] Error in decrement_item:', error);
    throw error;
  }
  console.log('[decrementOrDeleteCartItem] RPC decrement_item successful.');
}

// --- Hook principal useCart ---
function useCart(
  menuItems: MenuItemData[] | null,
  currentClientAlias: string | null,
  tableNumber: number | undefined | null,
) {
  console.log('[useCart] Hook ejecutándose. Dependencias:', {
    hasMenuItems: !!menuItems,
    currentClientAlias,
    tableNumber,
  });
  const [cart, setCart] = useState<Cart>({});
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [temporaryOrderId, setTemporaryOrderId] = useState<string>('');

  // --- Funciones Internas con Tipos Más Estrictos ---
  const getCartKey = useCallback(
    (
      itemId: string,
      modifiers: SelectedModifiers | null | undefined = null,
      alias: string = '',
    ): string => {
      return getCartKeyFromUtils(itemId, modifiers ?? null, alias);
    },
    [],
  );

  const calculateItemPrice = useCallback(
    (item: MenuItemData, modifiers: SelectedModifiers | null | undefined): number => {
      const basePrice = item?.price ?? 0;
      if (!modifiers) {
        return basePrice;
      }

      const modifiersPrice = Object.values(modifiers).reduce(
        (total: number, modifierGroup: SelectedModifier) => {
          if (modifierGroup && modifierGroup.options && Array.isArray(modifierGroup.options)) {
            const groupOptionPrice = modifierGroup.options.reduce(
              (sum: number, option: SelectedModifierOption) => sum + (option.extra_price || 0),
              0,
            );
            return total + groupOptionPrice;
          }
          return total;
        },
        0,
      );

      return basePrice + modifiersPrice;
    },
    [],
  );

  const updateCartTotal = useCallback(
    (currentCart: Cart, menuItemsData: MenuItemData[] | null) => {
      if (!menuItemsData) {
        console.warn(
          '[updateCartTotal] menuItemsData no disponible, no se puede calcular el total.',
        );
        setCartTotal(0);
        return;
      }
      console.log(
        '[updateCartTotal] Recalculando total para carrito:',
        Object.keys(currentCart).length,
        'ítems únicos',
      );
      const newTotal = Object.values(currentCart).reduce((sum, cartItem) => {
        const menuItem = menuItemsData.find((m) => m.id === cartItem.id);
        if (!menuItem) {
          console.warn(
            `[updateCartTotal] MenuItemData not found for ID: ${cartItem.id}. Skipping price calculation.`,
          );
          return sum;
        }
        const itemPrice = calculateItemPrice(menuItem, cartItem.modifiers);
        return sum + itemPrice * cartItem.quantity;
      }, 0);
      console.log('[updateCartTotal] Nuevo total calculado:', newTotal);
      setCartTotal(newTotal);
    },
    [calculateItemPrice],
  );

  // --- Efectos ---
  useEffect(() => {
    console.log('[useCart: InitEffect] triggered. Deps:', {
      tableNumber,
      hasMenuItems: !!menuItems,
    });

    const initializeCartData = async () => {
      if (typeof tableNumber !== 'number' || tableNumber <= 0) {
        console.log(
          '[useCart: InitEffect] No valid table number provided, skipping initialization',
        );
        return;
      }

      if (!menuItems || menuItems.length === 0) {
        console.log(
          '[useCart: InitEffect] menuItems not available, skipping cart items processing, but will try init OrderID',
        );
      }

      console.log('[useCart: InitEffect] Llamando a initializeCart con tableNumber:', tableNumber);
      try {
        const id = await initializeCart(tableNumber);
        console.log('[useCart: InitEffect] Temporary order ID obtenido:', id);
        setTemporaryOrderId(id);

        if (!menuItems?.length) {
          console.log(
            '[useCart: InitEffect] menuItems no disponibles al procesar items, carrito inicializado vacío.',
          );
          setCart({});
          setCartTotal(0);
          return;
        }

        const { data: items, error } = await supabase
          .from('temporary_order_items')
          .select('*')
          .eq('temporary_order_id', id);

        if (error) {
          console.error('[useCart: InitEffect] Error al cargar items del carrito:', error);
          return;
        }

        console.log('[useCart: InitEffect] Items cargados desde la DB:', items);

        const initialCartState: Cart = {};
        items?.forEach((item) => {
          const menuItem = menuItems.find((m) => m.id === item.menu_item_id);
          if (!menuItem) {
            console.warn(
              `[useCart: InitEffect] MenuItemData (ID: ${item.menu_item_id}) no encontrado en menuItems prop. Item no se añadirá.`,
            );
            return;
          }

          const cartKey = getCartKey(item.menu_item_id, item.modifiers_data ?? null, item.alias);
          initialCartState[cartKey] = {
            id: item.menu_item_id,
            quantity: item.quantity,
            modifiers: item.modifiers_data ?? {},
            item: menuItem,
            client_alias: item.alias,
          };
        });

        console.log(
          '[useCart: InitEffect] Estado inicial del carrito construido:',
          initialCartState,
        );
        setCart(initialCartState);
        updateCartTotal(initialCartState, menuItems);
      } catch (error) {
        console.error('[useCart: InitEffect] Error al inicializar carrito:', error);
      }
    };

    initializeCartData();
  }, [tableNumber, menuItems, getCartKey, updateCartTotal]);

  useEffect(() => {
    console.log('[useCart: RealtimeEffect] triggered. Deps:', {
      temporaryOrderId,
      hasMenuItems: !!menuItems,
    });
    if (!temporaryOrderId || !menuItems || menuItems.length === 0) {
      console.log(
        '[useCart: RealtimeEffect] No temporaryOrderId o menuItems no disponible, no se inicia la suscripción.',
      );
      return;
    }
    console.log(
      '[useCart: RealtimeEffect] Iniciando suscripción con temporaryOrderId:',
      temporaryOrderId,
    );

    const handleRealtimeChanges = (payload: RealtimePostgresChangesPayload<TemporaryOrderItem>) => {
      console.log('[useCart: RealtimeEffect] Payload recibido:', payload);
      console.log('[useCart: RealtimeEffect] Event type:', payload.eventType);

      const item = (payload.eventType === 'DELETE' ? payload.old : payload.new) as
        | TemporaryOrderItem
        | undefined;

      if (!item || !item.temporary_order_id) {
        console.warn(
          '[useCart: RealtimeEffect] Payload recibido sin datos válidos (new/old) o sin temporary_order_id.',
        );
        return;
      }

      if (item.temporary_order_id !== temporaryOrderId) {
        console.log('[useCart: RealtimeEffect] Cambio ignorado: pertenece a otra orden.');
        return;
      }
      console.log('[useCart: RealtimeEffect] Filtro de orden pasado.');

      const cartKey = getCartKey(item.menu_item_id, item.modifiers_data, item.alias);
      console.log(
        '[useCart: RealtimeEffect] Procesando cambio para cartKey:',
        cartKey,
        'Evento:',
        payload.eventType,
      );
      console.log('[useCart: RealtimeEffect] Datos relevantes:', {
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        modifiers_data: item.modifiers_data,
        alias: item.alias,
      });

      setCart((prevCart) => {
        const newCart = { ...prevCart };

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newItem = payload.new as TemporaryOrderItem;
          const menuItem = menuItems.find((m) => m.id === newItem.menu_item_id);

          if (!menuItem) {
            console.warn(
              `[useCart: RealtimeEffect] MenuItemData not found for ID: ${newItem.menu_item_id}. Cannot process update/insert from payload.`,
            );
            return prevCart;
          }

          // Siempre actualizamos el item, incluso si ya existe
          const cartKey = getCartKey(newItem.menu_item_id, newItem.modifiers_data, newItem.alias);
          newCart[cartKey] = {
            id: newItem.menu_item_id,
            quantity: newItem.quantity,
            modifiers: newItem.modifiers_data ?? {},
            item: menuItem,
            client_alias: newItem.alias,
          };
          console.log(
            '[useCart: RealtimeEffect] Item actualizado:',
            cartKey,
            'Nueva cantidad:',
            newItem.quantity,
          );
        } else if (payload.eventType === 'DELETE') {
          const oldItem = payload.old as TemporaryOrderItem;
          const cartKey = getCartKey(oldItem.menu_item_id, oldItem.modifiers_data, oldItem.alias);
          if (newCart[cartKey]) {
            delete newCart[cartKey];
            console.log('[useCart: RealtimeEffect] Item eliminado:', cartKey);
          }
        }

        // Siempre actualizamos el total y devolvemos un nuevo objeto
        updateCartTotal(newCart, menuItems);
        return { ...newCart };
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
          filter: `temporary_order_id=eq.${temporaryOrderId}`,
        },
        handleRealtimeChanges,
      )
      .subscribe((status) => {
        console.log('[useCart: RealtimeEffect] Estado de la suscripción:', status);
      });

    return () => {
      console.log(
        '[useCart: RealtimeEffect] Limpiando suscripción para temporaryOrderId:',
        temporaryOrderId,
      );
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [temporaryOrderId, menuItems, getCartKey, updateCartTotal]);

  // --- Funciones expuestas ---
  const getTotalItems = useCallback(() => {
    return Object.values(cart).reduce((sum: number, { quantity }: CartItem) => sum + quantity, 0);
  }, [cart]);

  const getItemQuantity = useCallback(
    (itemId: string) => {
      let quantity = 0;
      Object.values(cart).forEach((item) => {
        if (item && item.id === itemId) {
          quantity += item.quantity;
        }
      });
      return quantity;
    },
    [cart],
  );

  const handleAddToCart = useCallback(
    async (itemId: string, modifiers: SelectedModifiers | null = null) => {
      if (!temporaryOrderId) {
        console.warn('[handleAddToCart] temporaryOrderId no está disponible.');
        return;
      }
      const aliasToUse = currentClientAlias || 'guest';
      console.log('[handleAddToCart] Calling addOrIncrementCartItem:', {
        itemId,
        modifiers,
        temporaryOrderId,
        alias: aliasToUse,
      });

      // Actualización optimista
      setCart((prevCart) => {
        const newCart = { ...prevCart };
        const cartKey = getCartKey(itemId, modifiers, aliasToUse);
        const menuItem = menuItems?.find((m) => m.id === itemId);

        if (!menuItem) {
          console.warn('[handleAddToCart] MenuItem no encontrado para actualización optimista');
          return prevCart;
        }

        if (newCart[cartKey]) {
          newCart[cartKey] = {
            ...newCart[cartKey],
            quantity: newCart[cartKey].quantity + 1,
          };
        } else {
          newCart[cartKey] = {
            id: itemId,
            quantity: 1,
            modifiers: modifiers ?? {},
            item: menuItem,
            client_alias: aliasToUse,
          };
        }

        // Actualizar el total inmediatamente
        updateCartTotal(newCart, menuItems);
        return newCart;
      });

      try {
        await addOrIncrementCartItem(temporaryOrderId, itemId, modifiers, aliasToUse);
        console.log('[handleAddToCart] addOrIncrementCartItem success. Awaiting realtime update.');
      } catch (error) {
        console.error('[handleAddToCart] Error calling addOrIncrementCartItem:', error);
        // Revertir la actualización optimista en caso de error
        setCart((prevCart) => {
          const newCart = { ...prevCart };
          const cartKey = getCartKey(itemId, modifiers, aliasToUse);
          if (newCart[cartKey]) {
            if (newCart[cartKey].quantity > 1) {
              newCart[cartKey].quantity -= 1;
            } else {
              delete newCart[cartKey];
            }
          }
          updateCartTotal(newCart, menuItems);
          return newCart;
        });
      }
    },
    [temporaryOrderId, currentClientAlias, menuItems, updateCartTotal],
  );

  const handleDecrementCart = useCallback(
    async (itemId: string, modifiers: SelectedModifiers | null = null) => {
      if (!temporaryOrderId) {
        console.warn('[handleDecrementCart] temporaryOrderId no está disponible.');
        return;
      }
      const aliasToUse = currentClientAlias || 'guest';
      console.log('[handleDecrementCart] Calling decrementOrDeleteCartItem:', {
        itemId,
        modifiers,
        temporaryOrderId,
        alias: aliasToUse,
      });

      // Actualización optimista
      setCart((prevCart) => {
        const newCart = { ...prevCart };
        const cartKey = getCartKey(itemId, modifiers, aliasToUse);

        if (newCart[cartKey]) {
          if (newCart[cartKey].quantity > 1) {
            newCart[cartKey] = {
              ...newCart[cartKey],
              quantity: newCart[cartKey].quantity - 1,
            };
          } else {
            // Si la cantidad es 1, eliminamos el item
            delete newCart[cartKey];
          }

          // Actualizar el total inmediatamente
          updateCartTotal(newCart, menuItems);
        }

        return newCart;
      });

      try {
        await decrementOrDeleteCartItem(temporaryOrderId, itemId, modifiers, aliasToUse);
        console.log(
          '[handleDecrementCart] decrementOrDeleteCartItem success. Awaiting realtime update.',
        );
      } catch (error) {
        console.error('[handleDecrementCart] Error calling decrementOrDeleteCartItem:', error);
        // Revertir la actualización optimista en caso de error
        setCart((prevCart) => {
          const newCart = { ...prevCart };
          const cartKey = getCartKey(itemId, modifiers, aliasToUse);
          const menuItem = menuItems?.find((m) => m.id === itemId);

          if (!menuItem) {
            console.warn(
              '[handleDecrementCart] MenuItem no encontrado para revertir actualización',
            );
            return prevCart;
          }

          // Restaurar el item a su estado anterior
          if (newCart[cartKey]) {
            newCart[cartKey].quantity += 1;
          } else {
            newCart[cartKey] = {
              id: itemId,
              quantity: 1,
              modifiers: modifiers ?? {},
              item: menuItem,
              client_alias: aliasToUse,
            };
          }

          updateCartTotal(newCart, menuItems);
          return newCart;
        });
      }
    },
    [temporaryOrderId, currentClientAlias, menuItems, updateCartTotal],
  );

  // === Objeto de Acciones Memoizado ===
  const actions: CartActions = useMemo(
    () => ({
      handleAddToCart,
      handleDecrementCart,
      getTotalItems,
      getItemQuantity,
    }),
    [handleAddToCart, handleDecrementCart, getTotalItems, getItemQuantity],
  );

  return {
    cart,
    cartTotal,
    actions,
  };
}

export default useCart;
