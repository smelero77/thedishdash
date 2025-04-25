'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Cart, CartItem, MenuItemData } from '@/types/menu';
import useCart from '@/hooks/useCart';

interface CartContextType {
  cart: Cart;
  cartTotal: number;
  addToCart: (itemId: string, modifiers?: Record<string, any>) => void;
  removeFromCartByItem: (itemId: string, modifiers: Record<string, any>) => void;
  removeFromCartByKey: (cartKey: string, price: number) => void;
  getTotalItems: () => number;
  getItemQuantity: (itemId: string) => number;
  findCartKey: (itemId: string) => string | undefined;
  findExactCartKey: (itemId: string, modifiers: Record<string, any>) => string | undefined;
  calculateItemPrice: (item: MenuItemData, modifiers: Record<string, any>) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
  menuItems: MenuItemData[];
  currentClientAlias?: string;
}

export const CartProvider: React.FC<CartProviderProps> = ({ 
  children, 
  menuItems, 
  currentClientAlias 
}) => {
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
  } = useCart(menuItems, currentClientAlias);

  const value: CartContextType = {
    cart,
    cartTotal,
    addToCart: handleAddToCart,
    removeFromCartByItem: handleRemoveFromCartByItem,
    removeFromCartByKey: handleRemoveFromCartByKey,
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
}; 