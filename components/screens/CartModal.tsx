'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Users, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Cart, CartItem } from '@/types/menu';
import { removeFromCart, getItemTotalPrice, formatPrice } from '@/utils/cart';
import { getCartKey } from './MenuScreen';

interface MenuItemData {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

interface CartModalProps {
  items: {
    [key: string]: CartItem;
  };
  menuItems: MenuItemData[];
  onClose: () => void;
  onRemoveItem: (itemId: string, modifiers: Record<string, any>) => void;
  onAddToCart: (itemId: string, modifiers: Record<string, any>) => void;
  currentClientAlias?: string;
}

export default function CartModal({
  items,
  menuItems,
  onClose,
  onRemoveItem,
  onAddToCart,
  currentClientAlias,
}: CartModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 50);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  const handleQuantityChange = (item: CartItem, increment: boolean) => {
    if (increment) {
      onAddToCart(item.id, item.modifiers);
    } else {
      const cartKey = getCartKey(item.id, item.modifiers);
      onRemoveItem(cartKey);
    }
  };

  // Eliminar el estado local del carrito ya que usaremos el del padre
  const groupedItems = Object.values(items).reduce(
    (acc, cartItem) => {
      const alias = cartItem.client_alias || 'Sin alias';
      if (!acc[alias]) {
        acc[alias] = {
          items: [],
          total: 0,
          itemCount: 0,
        };
      }
      acc[alias].items.push(cartItem);
      acc[alias].total += getItemTotalPrice(cartItem);
      acc[alias].itemCount += cartItem.quantity;
      return acc;
    },
    {} as Record<string, { items: CartItem[]; total: number; itemCount: number }>,
  );

  const dinerCount = Object.keys(groupedItems).length;

  const getTotalPrice = () => {
    return Object.values(items).reduce((total, item) => {
      return total + getItemTotalPrice(item);
    }, 0);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Fondo semi-transparente */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.5 : 0 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isVisible ? 0 : '100%' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 bg-white overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-[#d0e6e4]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#0e1b19] text-xl font-bold leading-tight tracking-[-0.015em]">
                Tu pedido
              </h2>
              <button onClick={handleClose} className="text-[#4f968f] transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Resumen de comensales */}
            <div className="flex items-center gap-2 p-3 bg-[#f8fbfb] rounded-lg">
              <Users className="h-5 w-5 text-[#4f968f]" />
              <span className="text-[#0e1b19] text-sm font-medium">
                {dinerCount} {dinerCount === 1 ? 'comensal' : 'comensales'}
              </span>
            </div>

            {/* Avatares y resumen por persona */}
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(groupedItems).map(([alias, { itemCount, total }]) => (
                <div
                  key={alias}
                  className="flex items-center gap-2 p-2 bg-white border border-[#d0e6e4] rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-[#f8fbfb] rounded-full">
                    <span className="text-[#4f968f] text-sm font-semibold">
                      {alias.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#0e1b19] text-sm font-medium">{alias}</span>
                    <span className="text-[#4f968f] text-xs">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatPrice(total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
            {Object.entries(groupedItems).map(([alias, { items }]) => (
              <div key={alias} className="mb-6">
                <h3 className="text-[#0e1b19] text-base font-bold mb-3 flex items-center gap-2">
                  {alias === currentClientAlias ? 'Tu pedido' : `Pedido de ${alias}`}
                  <span className="text-[#4f968f] text-sm font-normal">
                    ({items.reduce((acc, item) => acc + item.quantity, 0)} items)
                  </span>
                </h3>
                {items.map((item) => (
                  <div key={`${item.id}-${JSON.stringify(item.modifiers)}`} className="mb-4">
                    <div className="flex items-start gap-3">
                      {item.item.image_url && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={item.item.image_url}
                            alt={item.item.name}
                            fill
                            sizes="(max-width: 768px) 64px, 64px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-[#0e1b19]">{item.item.name}</p>

                        {/* Mostrar modificadores si existen */}
                        {item.modifiers && Object.keys(item.modifiers).length > 0 ? (
                          <p className="text-sm text-[#4f968f]">
                            EXTRA:{' '}
                            {Object.entries(item.modifiers)
                              .flatMap(([_, modifier]) =>
                                modifier.options.map(
                                  (opt: { id: string; name: string; extra_price: number }) =>
                                    `${opt.name} (+${opt.extra_price.toFixed(2)}€)`,
                                ),
                              )
                              .join(', ')}
                          </p>
                        ) : null}

                        {/* Mostrar precio unitario debajo, SIEMPRE */}
                        <p className="text-sm text-[#4f968f] mt-1">
                          {formatPrice(getItemTotalPrice(item) / item.quantity)} c/u
                        </p>
                      </div>
                      <div className="flex items-center border border-[#d0e6e4] rounded-full bg-[#4f968f]/10">
                        <button
                          onClick={() => handleQuantityChange(item, false)}
                          className="w-8 h-8 flex items-center justify-center text-[#4f968f] hover:bg-[#4f968f]/20 transition-colors"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="h-4 w-4" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </button>
                        <div className="w-8 h-8 flex items-center justify-center text-[#0e1b19] font-medium">
                          {item.quantity}
                        </div>
                        <button
                          onClick={() => handleQuantityChange(item, true)}
                          className="w-8 h-8 flex items-center justify-center text-[#4f968f] hover:bg-[#4f968f]/20 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
            <div className="max-w-2xl mx-auto">
              <button className="w-full h-12 bg-[#1ce3cf] text-[#0e1b19] text-base font-bold leading-normal tracking-[0.015em] rounded-full shadow-lg hover:bg-[#1ce3cf] hover:text-[#0e1b19]">
                <span className="flex items-center justify-center gap-3">
                  <span>Confirmar pedido</span>
                  <span className="text-[#0e1b19] text-2xl font-extrabold">•</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
