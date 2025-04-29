'use client';

import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { X, Trash2, Users, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem, MenuItemData as CartMenuItemData, SelectedModifiers } from '@/types/menu';

import { CartItemsContext } from '@/context/CartItemsContext';
import { CartTotalContext } from '@/context/CartTotalContext';
import { CartActionsContext } from '@/context/CartActionsContext';

interface CartModalProps {
  onClose: () => void;
  currentClientAlias?: string;
}

const formatPrice = (price: number): string => price.toFixed(2).replace('.', ',') + ' €';

const CartModal = React.memo(function CartModal({
  onClose,
  currentClientAlias,
}: CartModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  const cart = useContext(CartItemsContext);
  const cartTotal = useContext(CartTotalContext);
  const actions = useContext(CartActionsContext);

  useEffect(() => {
    const timer = setTimeout(() => { setIsVisible(true); }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (cart === null || cartTotal === null || !actions) {
    console.warn("[CartModal] Esperando contextos del carrito...");
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <p>Cargando carrito...</p>
      </div>
    );
  }

  const groupedItems = useMemo(() => {
    console.log('[CartModal] Recalculando groupedItems');
    return Object.values(cart).reduce(
      (acc, cartItem) => {
        const alias = cartItem.client_alias || 'Sin alias';
        if (!acc[alias]) {
          acc[alias] = { items: [], total: 0, itemCount: 0 };
        }
        acc[alias].items.push(cartItem);
        acc[alias].itemCount += cartItem.quantity;
        return acc;
      },
      {} as Record<string, { items: CartItem[]; total: number; itemCount: number }>,
    );
  }, [cart]);

  const dinerCount = Object.keys(groupedItems).length;
  const totalQuantity = actions.getTotalItems();

  const handleQuantityChange = useCallback((item: CartItem, increment: boolean) => {
    if (!actions) return;
    const modifiersToPass = item.modifiers;
    if (increment) {
      actions.handleAddToCart(item.id, modifiersToPass);
    } else {
      actions.handleDecrementCart(item.id, modifiersToPass);
    }
  }, [actions]);

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isVisible ? 0 : '100%' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-hidden"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[#d0e6e4]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0e1b19]">Carrito</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-[#0e1b19]" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#4f968f]">
              <Users className="h-4 w-4" />
              <span>{dinerCount} comensal{dinerCount !== 1 ? 'es' : ''}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
            {Object.entries(groupedItems).map(([alias, { items: aliasItems }]) => (
              <div key={alias} className="mb-6">
                <h3 className="text-[#0e1b19] text-base font-bold mb-3 flex items-center gap-2">
                  {alias === currentClientAlias ? 'Tú' : alias}
                </h3>
                {aliasItems.map((item) => (
                  <div key={item.id + JSON.stringify(item.modifiers)} className="mb-4">
                    <div className="flex items-start gap-3">
                      {item.item.image_url && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={item.item.image_url}
                            alt={item.item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-[#0e1b19]">{item.item.name}</p>
                        {Object.entries(item.modifiers || {}).map(([modifierId, modifier]) => (
                          <p key={modifierId} className="text-sm text-gray-500">
                            {modifier.name}: {modifier.options.map(opt => opt.name).join(', ')}
                          </p>
                        ))}
                        <p className="text-sm text-[#4f968f] mt-1">
                          {formatPrice(item.item.price)} c/u
                        </p>
                      </div>
                      <div className="flex items-center border border-[#d0e6e4] rounded-full bg-[#4f968f]/10">
                        <button
                          onClick={() => handleQuantityChange(item, false)}
                          className="p-2 hover:bg-[#4f968f]/20 rounded-l-full"
                        >
                          {item.quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        </button>
                        <div className="w-8 h-8 flex items-center justify-center text-[#0e1b19] font-medium">
                          {item.quantity}
                        </div>
                        <button
                          onClick={() => handleQuantityChange(item, true)}
                          className="p-2 hover:bg-[#4f968f]/20 rounded-r-full"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {Object.keys(cart).length === 0 && (
              <p className="text-gray-500 text-center mt-8">Tu carrito está vacío.</p>
            )}
          </div>

          {Object.keys(cart).length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-[#d0e6e4] p-4 w-full max-w-md ml-auto">
              <div className="flex justify-between items-center font-bold text-lg mb-4">
                <span>Total ({totalQuantity} items)</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <button className="w-full h-12 bg-[#1ce3cf] text-[#0e1b19] text-base font-bold rounded-full shadow-lg hover:opacity-90">
                Confirmar pedido
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
});

export default CartModal;
