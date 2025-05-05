"use client";

import React, { ReactNode, useMemo } from 'react';
// Importa los 3 nuevos contextos específicos
import { CartItemsContext } from './CartItemsContext';
import { CartTotalContext } from './CartTotalContext';
import { CartActionsContext } from './CartActionsContext';
// Importa el hook useCart MODIFICADO
import useCart from '@/hooks/useCart';
// Importa los tipos necesarios
import { CartActions, Cart, MenuItemData } from '@/types/menu';

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
    handleAddToCart: async () => { console.warn("CartProvider not ready: handleAddToCart"); },
    handleDecrementCart: async () => { console.warn("CartProvider not ready: handleDecrementCart"); },
    getTotalItems: () => { console.warn("CartProvider not ready: getTotalItems"); return 0; },
    getItemQuantity: () => { console.warn("CartProvider not ready: getItemQuantity"); return 0; },
};

export function CartProvider({ children, menuItems }: CartProviderProps) {
    // Obtener dependencias de otros contextos
    const { alias } = useCustomer();
    const { tableNumber } = useTable();

    // Llamar al hook useCart con las dependencias obtenidas
    const {
        cart,
        cartTotal,
        actions,
    } = useCart(
        menuItems, // Desde props
        alias,     // Desde useCustomer
        tableNumber // Desde useTable
    );

    // Memoizar los valores del provider
    const safeCart = useMemo(() => cart ?? {}, [cart]);
    const safeCartTotal = useMemo(() => cartTotal ?? 0, [cartTotal]);
    const safeActions = useMemo(() => actions ?? defaultCartActions, [actions]);

    // Forzar la actualización cuando cambia el contenido del carrito
    React.useEffect(() => {
        console.log('[CartProvider] Cart updated:', Object.keys(cart).length, 'items');
    }, [cart]);

    console.log('[CartProvider] Rendering. Cart Items:', Object.keys(safeCart).length, 'Total:', safeCartTotal);

    // Renderizar los providers anidados
    return (
        <CartActionsContext.Provider value={safeActions}>
            <CartItemsContext.Provider value={safeCart}>
                <CartTotalContext.Provider value={safeCartTotal}>
                    {children}
                </CartTotalContext.Provider>
            </CartItemsContext.Provider>
        </CartActionsContext.Provider>
    );
} 