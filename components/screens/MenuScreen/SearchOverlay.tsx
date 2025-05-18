import React, { useContext, forwardRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import MenuItem from '../MenuItem';
import { MenuItemData } from '@/types/menu';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { CartItemsContext } from '@/context/CartItemsContext';
import { CartActionsContext } from '@/context/CartActionsContext';
import { useCustomer } from '@/context/CustomerContext';
import FloatingCartButton from './FloatingCartButton';
import { CartTotalContext } from '@/context/CartTotalContext';
import { Button } from '@/components/ui/button';
import ChatButton from '@/components/chat/ChatButton';

interface SearchOverlayProps {
  searchQuery: string;
  searchActive: boolean;
  filteredItems: MenuItemData[];
  handleSearch: (query: string) => void;
  onClose: () => void;
}

const SearchOverlayComponent = forwardRef<HTMLDivElement, SearchOverlayProps>(({
  searchQuery,
  searchActive,
  filteredItems,
  handleSearch,
  onClose
}, ref) => {
  const cart = useContext(CartItemsContext);
  const cartActions = useContext(CartActionsContext);
  const cartTotal = useContext(CartTotalContext);
  const { alias } = useCustomer();
  const [showCartModal, setShowCartModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Efecto para controlar el estado de búsqueda
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300); // Mismo tiempo que el debounce
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleAddToCart = useCallback((itemId: string) => {
    if (cartActions && typeof cartActions === 'object' && 'handleAddToCart' in cartActions) {
      (cartActions as any).handleAddToCart(itemId, {});
    }
  }, [cartActions]);

  const handleRemoveFromCart = useCallback((itemId: string) => {
    if (cartActions && typeof cartActions === 'object' && 'handleDecrementCart' in cartActions) {
      (cartActions as any).handleDecrementCart(itemId, {});
    }
  }, [cartActions]);

  const getCartQuantityForItem = useCallback((itemId: string) => {
    if (!cart || !alias) return 0;
    let totalQuantity = 0;
    Object.values(cart).forEach(item => {
      if (item.id === itemId && item.client_alias === alias) {
        totalQuantity += item.quantity;
      }
    });
    return totalQuantity;
  }, [cart, alias]);

  return (
    <AnimatePresence>
      {searchActive && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-40 bg-white/90 backdrop-blur-md flex flex-col overflow-hidden"
          ref={ref}
        >
          <div className="flex flex-col h-full">
            {/* Header con input de búsqueda */}
            <div className="p-4 border-b border-[#d0e6e4]">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar en el menú..."
                  className="w-full px-5 py-3 text-lg rounded-full border-[1px] border-[#d0e6e4] focus:outline-none focus:ring-2 focus:ring-[#1ce3cf] focus:border-transparent"
                  style={{ fontFamily: 'Epilogue, \"Noto Sans\", sans-serif' }}
                  autoFocus
                />
                <button
                  onClick={onClose}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#4f968f] hover:text-[#0e1b19] transition-colors"
                  aria-label="Cerrar búsqueda"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Área de resultados con scroll oculto */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20">
              {searchQuery && searchQuery.trim().length >= 3 ? (
                <div className="pt-4">
                  {isSearching ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 px-4">
                      <div className="w-64 h-64">
                        <DotLottieReact
                          src="https://lottie.host/4ed7bf92-15ef-455a-8326-4b24d2ffac1e/GGQCg185BX.lottie"
                          loop
                          autoplay
                        />
                      </div>
                      <p className="text-[#4f968f] text-center mt-4 text-base font-medium">
                        Buscando...
                      </p>
                    </div>
                  ) : filteredItems.length > 0 ? (
                    <div className="space-y-2">
                      {filteredItems.map((item) => {
                        const quantity = getCartQuantityForItem(item.id);
                        
                        return (
                          <MenuItem
                            key={item.id}
                            {...item}
                            allergens={(item.allergens ?? []).map(allergen => ({
                              ...allergen,
                              icon_url: allergen.icon_url ?? ''
                            }))}
                            onAddToCart={() => handleAddToCart(item.id)}
                            onRemoveFromCart={() => handleRemoveFromCart(item.id)}
                            quantity={quantity}
                            diet_tags={[]}
                            food_info=""
                            origin=""
                            pairing_suggestion=""
                            chef_notes=""
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 px-4">
                      <div className="w-64 h-64">
                        <DotLottieReact
                          src="https://lottie.host/4ed7bf92-15ef-455a-8326-4b24d2ffac1e/GGQCg185BX.lottie"
                          loop
                          autoplay
                        />
                      </div>
                      <p className="text-[#4f968f] text-center mb-4">
                        No se encontraron resultados para "{searchQuery}"
                      </p>
                      <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-[#4f968f] hover:text-[#0e1b19] transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Volver al menú</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 px-4">
                  <div className="w-64 h-64">
                    <DotLottieReact
                      src="https://lottie.host/4ed7bf92-15ef-455a-8326-4b24d2ffac1e/GGQCg185BX.lottie"
                      loop
                      autoplay
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="fixed bottom-4 left-4 right-4 flex items-center gap-4">
            <FloatingCartButton
              onClick={() => setShowCartModal(true)}
              getTotalItems={cartActions && typeof cartActions === 'object' && 'getTotalItems' in cartActions ? (cartActions as any).getTotalItems : () => 0}
              cartTotal={cartTotal as number}
            />
            <ChatButton onClick={() => setShowChatModal(true)} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SearchOverlayComponent.displayName = "SearchOverlay";
export default React.memo(SearchOverlayComponent); 