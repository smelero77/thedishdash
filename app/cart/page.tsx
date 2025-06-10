'use client';

import React, { useCallback, useContext, useMemo, useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { motion, useAnimate } from 'framer-motion';
import { CartItem } from '@/types/menu';
import { OrderStories } from '@/components/screens/OrderStories';
import { ScrollProgressBar } from '@/components/ScrollProgressBar';
import { formatPrice } from '@/utils/format';
import { TextLogoSvg } from '@/components/TextLogoSvg';
import { Button } from '@/components/ui/Button';

import { CartItemsContext } from '@/context/CartItemsContext';
import { CartTotalContext } from '@/context/CartTotalContext';
import { CartActionsContext } from '@/context/CartActionsContext';
import { getCartKey, normalizeModifiers } from '@/utils/cartTransformers';
import { useCustomer } from '@/context/CustomerContext';

export default function CartPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [topOffset, setTopOffset] = useState(0);
  const [scope, animate] = useAnimate();

  const cart = useContext(CartItemsContext);
  const cartTotal = useContext(CartTotalContext);
  const actions = useContext(CartActionsContext);

  // Medir altura del header fijo (que incluye header + stories + barras)
  useEffect(() => {
    const headerH = headerRef.current?.offsetHeight ?? 0;
    setTopOffset(headerH);
  }, []);

  const handleGoBack = useCallback(async () => {
    // Animar la salida
    await animate(scope.current, {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    });
    router.back();
  }, [router, animate]);
  const handleCheckout = useCallback(() => alert('Redirigiendo al proceso de pago...'), []);

  const groupedItems = useMemo(() => {
    if (!cart) return {};
    return Object.values(cart).reduce(
      (acc, item) => {
        const aliasKey = item.client_alias || 'Sin alias';
        if (!acc[aliasKey]) {
          acc[aliasKey] = { items: [], itemCount: 0, total: 0 };
        }
        acc[aliasKey].items.push(item);
        acc[aliasKey].itemCount += item.quantity;
        acc[aliasKey].total +=
          item.quantity *
          (item.item.price +
            Object.values(item.modifiers || {}).reduce(
              (sum, m) => sum + m.options.reduce((optSum, o) => optSum + o.extra_price, 0),
              0,
            ));
        return acc;
      },
      {} as Record<string, { items: CartItem[]; itemCount: number; total: number }>,
    );
  }, [cart]);

  const alias = useCustomer().alias;

  const handleQuantityChange = useCallback(
    async (item: CartItem, increment: boolean) => {
      if (!actions) return;
      const mods = normalizeModifiers(item.modifiers);
      try {
        if (increment) await actions.handleAddToCart(item.id, mods);
        else await actions.handleDecrementCart(item.id, mods);
      } catch (e) {
        console.error('Error al actualizar cantidad:', e);
      }
    },
    [actions],
  );

  if (cart == null || cartTotal == null || !actions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando carrito...</p>
      </div>
    );
  }

  const totalItems = actions.getTotalItems();

  return (
    <motion.div
      ref={scope}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 30,
          mass: 0.8,
        },
      }}
      className="flex flex-col min-h-screen bg-white cart-container"
    >
      {/* Header + Stories fijos */}
      <motion.div
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-white"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="h-12 flex items-center">
              <TextLogoSvg className="h-10 w-auto" />
            </div>
            <motion.button
              onClick={handleGoBack}
              className="p-2 -m-2 text-[#4f968f]"
              aria-label="Cerrar"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-6 w-6" />
            </motion.button>
          </div>
        </div>

        <div className="border-b border-[#d0e6e4]">
          <OrderStories groupedItems={groupedItems} />
        </div>

        <ScrollProgressBar className="sticky top-0 z-20 -mt-[1px]" />
      </motion.div>

      {/* Contenido desplazado por padding, pero scroll en body */}
      <motion.main
        ref={contentRef}
        className="flex-grow w-full max-w-2xl px-4 pb-48 mx-auto"
        style={{ paddingTop: `${topOffset}px` }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] text-center">
            <ShoppingCart className="w-24 h-24 mb-6 text-[#4f968f]/70" />
            <h2 className="text-2xl font-semibold text-[#0e1b19] mb-3">Tu carrito está vacío</h2>
            <p className="text-[#4f968f] mb-8">
              Explora nuestros deliciosos platos y añádelos aquí.
            </p>
            <Button onClick={() => router.push('/menu')} size="lg">
              Volver al Menú
            </Button>
          </div>
        ) : (
          <div className="pt-2 divide-y divide-[#d0e6e4]">
            {Object.entries(groupedItems)
              .sort(([a], [b]) => (a === alias ? -1 : b === alias ? 1 : a.localeCompare(b)))
              .map(([groupAlias, group]) => (
                <div key={groupAlias} className="py-4">
                  <h3 className="text-[#0e1b19] text-base font-bold mb-4 flex items-center gap-2">
                    {groupAlias === alias ? 'Tu pedido' : `Pedido de ${groupAlias}`}
                  </h3>
                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <div
                        key={getCartKey(item.id, item.modifiers ?? null, item.client_alias || '')}
                        className="flex items-start gap-4"
                      >
                        {item.item.image_url && (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                            <Image
                              src={item.item.image_url}
                              alt={item.item.name}
                              fill
                              sizes="(max-width: 768px) 80px, 80px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[#0e1b19] text-base">{item.item.name}</p>
                          {Object.entries(item.modifiers || {}).map(([modId, mod]) => (
                            <p key={modId} className="text-sm text-[#4f968f] mt-1">
                              {mod.options
                                .map((opt) =>
                                  opt.extra_price > 0
                                    ? `+${opt.name} (+${opt.extra_price.toFixed(2)}€)`
                                    : `• ${opt.name}`,
                                )
                                .join(', ')}
                            </p>
                          ))}
                          <p className="text-sm text-[#4f968f] mt-2">
                            {formatPrice(
                              item.item.price +
                                Object.values(item.modifiers || {}).reduce(
                                  (sum, m) =>
                                    sum +
                                    m.options.reduce((optSum, o) => optSum + o.extra_price, 0),
                                  0,
                                ),
                            )}{' '}
                            c/u
                          </p>
                        </div>
                        <div className="flex items-center border border-[#d0e6e4] rounded-full bg-[#4f968f]/10">
                          {groupAlias === alias ? (
                            <>
                              <button
                                onClick={() => handleQuantityChange(item, false)}
                                className="w-10 h-10 flex items-center justify-center text-[#4f968f] hover:bg-[#4f968f]/20"
                                aria-label={item.quantity === 1 ? 'Eliminar' : 'Quitar uno'}
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="h-5 w-5" />
                                ) : (
                                  <Minus className="h-5 w-5" />
                                )}
                              </button>
                              <div className="w-10 h-10 flex items-center justify-center text-[#0e1b19] font-medium">
                                {item.quantity}
                              </div>
                              <button
                                onClick={() => handleQuantityChange(item, true)}
                                className="w-10 h-10 flex items-center justify-center text-[#4f968f] hover:bg-[#4f968f]/20"
                                aria-label="Añadir uno más"
                              >
                                <Plus className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center text-[#0e1b19] font-medium">
                              {item.quantity}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </motion.main>

      {/* Footer */}
      {totalItems > 0 && (
        <motion.footer
          className="fixed bottom-4 left-0 right-0 z-30 px-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleCheckout}
              className="w-full h-12 bg-[#1ce3cf] text-[#0e1b19] font-bold rounded-full shadow-lg"
            >
              <div className="flex items-center justify-center gap-3">
                <span>Confirmar pedido</span>
                <span className="text-2xl font-extrabold">•</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
            </button>
          </div>
        </motion.footer>
      )}
    </motion.div>
  );
}
