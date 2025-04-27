import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import MenuItem from '../MenuItem';
import { MenuItemData, Cart } from '@/types/menu';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { getCartQuantityForItem, removeFromCart } from '@/utils/cart';

interface SearchOverlayProps {
  searchQuery: string;
  searchActive: boolean;
  filteredItems: MenuItemData[];
  handleSearch: (query: string) => void;
  onClose: () => void;
  onAddToCart: (itemId: string) => void;
  onRemoveItem: (cartKey: string) => void;
  cart: Cart;
  resetSearch: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({
  searchQuery,
  searchActive,
  filteredItems,
  handleSearch,
  onClose,
  onAddToCart,
  onRemoveItem,
  cart,
  resetSearch
}) => {
  // Función para manejar la eliminación de ítems del carrito
  const handleRemoveFromCart = (itemId: string) => {
    removeFromCart(cart, itemId, onRemoveItem, 'SearchOverlay');
  };

  return (
    <AnimatePresence>
      {searchActive && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-40 bg-white/90 backdrop-blur-md flex flex-col overflow-hidden"
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
                  onClick={resetSearch}
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
                  {filteredItems.length > 0 ? (
                    <div className="space-y-2">
                      {filteredItems.map((item) => {
                        const quantity = getCartQuantityForItem(cart, item.id);
                        
                        return (
                          <MenuItem
                            key={item.id}
                            {...item}
                            allergens={(item.allergens ?? []).map(allergen => ({
                              ...allergen,
                              icon_url: allergen.icon_url ?? ''
                            }))}
                            onAddToCart={() => onAddToCart(item.id)}
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
                    <div className="flex flex-col items-center justify-center h-full py-8">
                      <p className="text-[#4f968f] text-center mb-4">
                        No se encontraron resultados para "{searchQuery}"
                      </p>
                      <button
                        onClick={resetSearch}
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
                  <p className="text-[#4f968f] text-center mt-4 text-base font-medium">
                    Search the menu
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay; 