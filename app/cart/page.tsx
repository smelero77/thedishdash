'use client';

import React, { useCallback, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2, Plus, Minus, CreditCard, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
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

export default function CartPage() {
  const router = useRouter();
  const contentRef = React.useRef<HTMLDivElement>(null);

  const cart = useContext(CartItemsContext);
  const cartTotal = useContext(CartTotalContext);
  const actions = useContext(CartActionsContext);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleCheckout = useCallback(() => {
    // TODO: Implementar lógica de checkout
    alert('Redirigiendo al proceso de pago...');
  }, []);

  const groupedItems = useMemo(() => {
    if (!cart) return {};

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

  const handleQuantityChange = useCallback(
    async (item: CartItem, increment: boolean) => {
      if (!actions) return;
      const normalizedModifiers = normalizeModifiers(item.modifiers);
      try {
        if (increment) {
          await actions.handleAddToCart(item.id, normalizedModifiers);
        } else {
          await actions.handleDecrementCart(item.id, normalizedModifiers);
        }
      } catch (error) {
        console.error('Error al actualizar la cantidad:', error);
      }
    },
    [actions],
  );

  if (cart === null || cartTotal === null || !actions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando carrito...</p>
      </div>
    );
  }

  const totalItems = actions.getTotalItems();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header fijo */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white">
        {/* Título y botón de cerrar */}
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="h-12 flex items-center">
              <TextLogoSvg className="h-10 w-auto" />
            </div>
            <button
              onClick={handleGoBack}
              className="p-2 -m-2 text-[#4f968f] transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Stories fijos */}
        <div className="border-b border-[#d0e6e4]">
          <OrderStories groupedItems={groupedItems} />
        </div>

        {/* Barra de progreso */}
        <ScrollProgressBar containerRef={contentRef} className="sticky top-0 z-20" />
      </div>

      {/* Espacio para compensar el header fijo */}
      <div className="h-[calc(72px+var(--stories-height)+1px+4px)]" />

      {/* Contenido principal */}
      <main ref={contentRef} className="flex-grow w-full max-w-2xl px-4 pb-48 mx-auto">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-300px)] text-center">
            <ShoppingCart className="w-24 h-24 mx-auto mb-6 text-[#4f968f]/70" />
            <h2 className="mb-3 text-2xl font-semibold text-[#0e1b19]">Tu carrito está vacío</h2>
            <p className="mb-8 text-[#4f968f]">
              Explora nuestros deliciosos platos y añádelos aquí.
            </p>
            <Button
              onClick={() => router.push('/menu')}
              size="lg"
              className="bg-[#1ce3cf] text-[#0e1b19] hover:bg-[#1ce3cf] hover:text-[#0e1b19]"
            >
              Volver al Menú
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems)
              .sort(([aliasA], [aliasB]) => aliasA.localeCompare(aliasB))
              .map(([alias, { items: aliasItems }]) => (
                <div key={alias}>
                  <h3 className="text-[#0e1b19] text-base font-bold mb-4 flex items-center gap-2">
                    {alias === 'Sin alias' ? 'Tu pedido' : `Pedido de ${alias}`}
                  </h3>
                  <div className="space-y-4">
                    {aliasItems.map((item) => (
                      <div
                        key={getCartKey(item.id, item.modifiers ?? null, item.client_alias || '')}
                      >
                        <div className="flex items-start gap-4">
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
                            {Object.entries(item.modifiers || {}).map(([modifierId, modifier]) => (
                              <p key={modifierId} className="text-sm text-[#4f968f] mt-1">
                                {modifier.options
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
                                    (total, modifier) =>
                                      total +
                                      modifier.options.reduce(
                                        (optTotal, opt) => optTotal + opt.extra_price,
                                        0,
                                      ),
                                    0,
                                  ),
                              )}{' '}
                              c/u
                            </p>
                          </div>
                          <div className="flex items-center border border-[#d0e6e4] rounded-full bg-[#4f968f]/10">
                            <button
                              onClick={() => handleQuantityChange(item, false)}
                              className="w-10 h-10 flex items-center justify-center text-[#4f968f] hover:bg-[#4f968f]/20 transition-colors"
                              aria-label={item.quantity === 1 ? 'Eliminar' : 'Quitar uno'}
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="h-5 w-5" />
                              ) : (
                                <Minus className="h-5 w-5" />
                              )}
                            </button>
                            <div className="w-10 h-10 flex items-center justify-center text-[#0e1b19] font-medium text-base">
                              {item.quantity}
                            </div>
                            <button
                              onClick={() => handleQuantityChange(item, true)}
                              className="w-10 h-10 flex items-center justify-center text-[#4f968f] hover:bg-[#4f968f]/20 transition-colors"
                              aria-label="Añadir uno más"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Footer */}
      {totalItems > 0 && (
        <footer className="fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="max-w-2xl mx-auto">
            <button
              className="w-full h-12 bg-[#1ce3cf] text-[#0e1b19] text-base font-bold leading-normal tracking-[0.015em] rounded-full shadow-lg hover:bg-[#1ce3cf] hover:text-[#0e1b19]"
              onClick={handleCheckout}
            >
              <span className="flex items-center justify-center gap-3">
                <span>Confirmar pedido</span>
                <span className="text-[#0e1b19] text-2xl font-extrabold">•</span>
                <span>{formatPrice(cartTotal)}</span>
              </span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
