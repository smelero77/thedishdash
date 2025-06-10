'use client';

import React, { ReactNode, useMemo, useState, useEffect } from 'react';
// Importa los 3 nuevos contextos específicos
import { CartItemsContext } from './CartItemsContext';
import { CartTotalContext } from './CartTotalContext';
import { CartActionsContext } from './CartActionsContext';
// Importa el hook useCart MODIFICADO
import useCart from '@/hooks/useCart';
// Importa los tipos necesarios
import { Cart, MenuItemData } from '@/types/menu';
import { CartActions } from '@/types/cart';

// Importa los hooks que proveen las dependencias para useCart
import { useCustomer } from './CustomerContext';
import { useTable } from './TableContext';

// Define las props que necesita este provider
interface CartProviderProps {
  children: ReactNode;
  menuItems: MenuItemData[] | null; // Recibe menuItems desde Providers (originado en RootLayout)
}

// Objeto de acciones por defecto para evitar errores si se accede al contexto antes de tiempo
const defaultCartActions: CartActions = {
  handleAddToCart: async () => {
    console.warn('CartProvider not ready: handleAddToCart');
  },
  handleDecrementCart: async () => {
    console.warn('CartProvider not ready: handleDecrementCart');
  },
  getTotalItems: () => {
    console.warn('CartProvider not ready: getTotalItems');
    return 0;
  },
  getItemQuantity: () => {
    console.warn('CartProvider not ready: getItemQuantity');
    return 0;
  },
};

export function CartProvider({ children, menuItems }: CartProviderProps) {
  // Obtener dependencias de otros contextos
  const { alias } = useCustomer();
  const { tableNumber } = useTable();
  const [cartVersion, setCartVersion] = useState(0);

  // Llamar al hook useCart con las dependencias obtenidas
  const { cart, cartTotal, actions } = useCart(
    menuItems, // Desde props
    alias, // Desde useCustomer
    tableNumber, // Desde useTable
  );

  // Forzar actualización cuando cambia el carrito
  useEffect(() => {
    setCartVersion((prev) => prev + 1);
  }, [cart]);

  // Memoizar los valores del provider con la versión del carrito
  const safeCart = useMemo(() => {
    return cart ?? {};
  }, [cart, cartVersion]);

  const safeCartTotal = useMemo(() => {
    return cartTotal ?? 0;
  }, [cartTotal, cartVersion]);

  const safeActions = useMemo(() => {
    return actions ?? defaultCartActions;
  }, [actions, cartVersion]);

  // Renderizar los providers anidados
  return (
    <CartActionsContext.Provider value={safeActions}>
      <CartItemsContext.Provider value={safeCart}>
        <CartTotalContext.Provider value={safeCartTotal}>{children}</CartTotalContext.Provider>
      </CartItemsContext.Provider>
    </CartActionsContext.Provider>
  );
}
