'use client';

import React, { useState, useEffect, useContext, useMemo, useCallback, forwardRef } from 'react';
import { X, Trash2, Users, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem, MenuItemData as CartMenuItemData, SelectedModifiers } from '@/types/menu';

import { CartItemsContext } from '@/context/CartItemsContext';
import { CartTotalContext } from '@/context/CartTotalContext';
import { CartActionsContext } from '@/context/CartActionsContext';
import { getCartKey, normalizeModifiers } from '@/utils/cartTransformers';

interface CartModalProps {
  onClose: () => void;
  currentClientAlias?: string;
}

const formatPrice = (price: number): string => price.toFixed(2).replace('.', ',') + ' €';

const CartModalComponent = forwardRef<HTMLDivElement, CartModalProps>(({
  onClose,
  currentClientAlias,
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [cartVersion, setCartVersion] = useState(0);

  const cart = useContext(CartItemsContext);
  const cartTotal = useContext(CartTotalContext);
  const actions = useContext(CartActionsContext);

  useEffect(() => {
    const timer = setTimeout(() => { setIsVisible(true); }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cart) {
      setCartVersion(prev => prev + 1);
    }
  }, [cart]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  }, [onClose]);

  if (cart === null || cartTotal === null || !actions) {
    console.warn("[CartModal] Esperando contextos del carrito...");
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <p>Cargando carrito...</p>
      </div>
    );
  }

  const groupedItems = useMemo(() => {
    console.log('[CartModal] Recalculando groupedItems, versión:', cartVersion);
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
  }, [cart, cartVersion]);

  const dinerCount = Object.keys(groupedItems).length;
  const totalQuantity = actions.getTotalItems();

  const handleQuantityChange = useCallback((item: CartItem, increment: boolean) => {
    if (!actions) return;
    const normalizedModifiers = normalizeModifiers(item.modifiers);
    if (increment) {
      actions.handleAddToCart(item.id, normalizedModifiers);
    } else {
      actions.handleDecrementCart(item.id, normalizedModifiers);
    }
  }, [actions]);

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.5 : 0 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black"
        onClick={handleClose}
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isVisible ? 0 : '100%' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 bg-white overflow-hidden"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[#d0e6e4]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#0e1b19] text-xl font-bold leading-tight tracking-[-0.015em]">Tu pedido</h2>
              <button
                onClick={handleClose}
                className="text-[#4f968f] transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-[#f8fbfb] rounded-lg">
              <Users className="h-5 w-5 text-[#4f968f]" />
              <span className="text-[#0e1b19] text-sm font-medium">
                {dinerCount} {dinerCount === 1 ? 'comensal' : 'comensales'}
              </span>
            </div>

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

          <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
            {Object.entries(groupedItems).map(([alias, { items: aliasItems }]) => (
              <div key={alias} className="mb-6">
                <h3 className="text-[#0e1b19] text-base font-bold mb-3 flex items-center gap-2">
                  {alias === currentClientAlias ? 'Tu pedido' : `Pedido de ${alias}`}
                  <span className="text-[#4f968f] text-sm font-normal">
                    ({aliasItems.reduce((acc, item) => acc + item.quantity, 0)} items)
                  </span>
                </h3>
                {aliasItems.map((item) => (
                  <div key={getCartKey(item.id, item.modifiers, item.client_alias || '')} className="mb-4">
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
                        {Object.entries(item.modifiers || {}).map(([modifierId, modifier]) => (
                          <p key={modifierId} className="text-sm text-[#4f968f]">
                            EXTRA: {modifier.options.map(opt => `${opt.name} (+${opt.extra_price.toFixed(2)}€)`).join(', ')}
                          </p>
                        ))}
                        <p className="text-sm text-[#4f968f] mt-1">
                          {formatPrice(item.item.price)} c/u
                        </p>
                      </div>
                      <div className="flex items-center border border-[#d0e6e4] rounded-full bg-[#4f968f]/10">
                        {alias === currentClientAlias ? (
                          <>
                            <button
                              onClick={() => handleQuantityChange(item, false)}
                              className="w-8 h-8 flex items-center justify-center text-[#4f968f] hover:bg-[#4f968f]/20 transition-colors"
                            >
                              {item.quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
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
                          </>
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center text-[#0e1b19] font-medium">
                            {item.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
            <div className="max-w-2xl mx-auto">
              <button className="w-full h-12 bg-[#1ce3cf] text-[#0e1b19] text-base font-bold leading-normal tracking-[0.015em] rounded-full shadow-lg hover:bg-[#1ce3cf] hover:text-[#0e1b19]">
                <span className="flex items-center justify-center gap-3">
                  <span>Confirmar pedido</span>
                  <span className="text-[#0e1b19] text-2xl font-extrabold">•</span>
                  <span>{formatPrice(cartTotal)}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

CartModalComponent.displayName = "CartModal";
export default React.memo(CartModalComponent);

