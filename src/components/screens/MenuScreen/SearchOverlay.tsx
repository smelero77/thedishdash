import React, { forwardRef, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

// Dependencias y Tipos
import { CartActionsContext } from '@/context/CartActionsContext';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useModifiers } from '@/hooks/useModifiers';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { handleModifierSubmit } from '@/hooks/useModifierSubmit';
import { MenuItemData } from '@/types/menu';

// Lógica y UI Refactorizada
import { useSearchHandler } from '@/hooks/useSearchHandler';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { TextLogoSvg } from '@/components/TextLogoSvg';
import ProductDetailSheet from './ProductDetailSheet';
import ModifierModal from '../ModifierModal';
import CategoryFilterModal from './CategoryFilterModal';
import { SearchInput } from './SearchInput';
import { SearchSuggestions } from './SearchSuggestions';
import { SearchResults } from './SearchResults';
import { FilterBar } from './FilterBar';

// Props del componente
interface SearchOverlayProps {
  searchActive: boolean;
  onClose: () => void;
  initialMenuItems: MenuItemData[];
  allCategories: string[];
  onFilterSectionChange?: (section: string | null) => void;
}

const SearchOverlayComponent = forwardRef<HTMLDivElement, SearchOverlayProps>(
  ({ searchActive, onClose, initialMenuItems, allCategories, onFilterSectionChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useLockBodyScroll(containerRef);

    // Hooks de lógica
    const {
      filters,
      handlers,
      activeFilterModal,
      openFilterModal,
      closeFilterModal,
      resetFilters,
      isAnyFilterActive,
    } = useSearchFilters(onFilterSectionChange);
    const { query, setQuery, results, isLoading, error } = useSearchHandler(
      initialMenuItems,
      filters,
    );
    const { searchHistory, addToHistory } = useSearchHistory();

    // Lógica para añadir al historial cuando la búsqueda se estabiliza
    useEffect(() => {
      if (query.trim() && !isLoading) {
        addToHistory(query.trim());
      }
    }, [results, isLoading, query, addToHistory]);

    // Estados y lógica para los modales de producto
    const [selectedProduct, setSelectedProduct] = useState<MenuItemData | null>(null);
    const handleItemClick = useCallback((item: MenuItemData) => {
      setSelectedProduct(item);
    }, []);

    return (
      <AnimatePresence>
        {searchActive && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <header
              className="flex items-center justify-between bg-white px-4 flex-shrink-0"
              style={{
                paddingTop: 'calc(env(safe-area-inset-top, 1rem) + 0.5rem)',
                paddingBottom: '0.5rem',
              }}
            >
              <button onClick={onClose} className="p-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
              </button>
              <TextLogoSvg className="h-10 w-auto" />
              <div className="w-6" />
            </header>

            <div className="p-4 pt-2 flex-shrink-0">
              <SearchInput query={query} onQueryChange={setQuery} onClear={() => setQuery('')} />
            </div>

            <FilterBar
              onFilterClick={openFilterModal}
              isAnyFilterActive={isAnyFilterActive}
              onResetFilters={resetFilters}
            />

            <div className="flex-1 overflow-y-auto px-4">
              {error && <p className="text-red-500 text-center py-8">{error}</p>}

              {!query.trim() && !isLoading && (
                <SearchSuggestions history={searchHistory} onSearch={setQuery} />
              )}

              {(query.trim() || isLoading) && (
                <SearchResults
                  items={results}
                  isLoading={isLoading}
                  query={query}
                  onClear={() => setQuery('')}
                  onItemClick={handleItemClick}
                />
              )}
            </div>

            {/* Modales */}
            <CategoryFilterModal
              isOpen={activeFilterModal === 'categories'}
              onClose={closeFilterModal}
              allCategories={allCategories}
              selectedCategories={filters.categories}
              onApply={handlers.handleCategoryChange}
            />
            {selectedProduct && (
              <ProductDetailSheet
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
                onAddToCart={() => {}}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

SearchOverlayComponent.displayName = 'SearchOverlay';
export default React.memo(SearchOverlayComponent);
