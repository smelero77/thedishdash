'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Cart, CartItem, MenuItemData } from '@/types/menu';
import useCart from '@/hooks/useCart';

interface CartContextType {
  cart: Cart;
  cartTotal: number;
  addToCart: (itemId: string, modifiers: Record<string, any>) => void;
  removeFromCartByItem: (itemId: string, modifiers: Record<string, any>) => void;
  removeFromCartByKey: (key: string) => void;
  getTotalItems: () => number;
  getItemQuantity: (itemId: string) => number;
  findCartKey: (itemId: string, modifiers: Record<string, any>) => string | null;
  findExactCartKey: (itemId: string, modifiers: Record<string, any>) => string | null;
  calculateItemPrice: (itemId: string, modifiers: Record<string, any>) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
  menuItems: MenuItemData[];
  slotId: string;
  alias: string;
  tableCode: string;
}

export function CartProvider({ children, menuItems, slotId, alias, tableCode }: CartProviderProps) {
  const {
    cart,
    cartTotal,
    handleAddToCart,
    handleRemoveFromCartByItem,
    handleRemoveFromCartByKey,
    getTotalItems,
    getItemQuantity,
    findCartKey,
    findExactCartKey,
    calculateItemPrice
  } = useCart(menuItems, alias);

  // Ahora simplemente
  const addToCart = handleAddToCart;
  const removeFromCartByItem = handleRemoveFromCartByItem;
  const removeFromCartByKey = handleRemoveFromCartByKey;

  const value: CartContextType = {
    cart,
    cartTotal,
    addToCart,
    removeFromCartByItem,
    removeFromCartByKey,
    getTotalItems,
    getItemQuantity,
    findCartKey,
    findExactCartKey,
    calculateItemPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
} 