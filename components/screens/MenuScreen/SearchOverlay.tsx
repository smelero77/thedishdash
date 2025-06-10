import React, { useContext, forwardRef, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Search, Filter, ChevronRight, Euro } from 'lucide-react';
import MenuItem from '../MenuItem';
import { MenuItemData, MenuItemAllergen } from '@/types/menu';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { CartItemsContext } from '@/context/CartItemsContext';
import { CartActionsContext } from '@/context/CartActionsContext';
import { useCustomer } from '@/context/CustomerContext';
import { CartTotalContext } from '@/context/CartTotalContext';
import { TextLogoSvg } from '@/components/TextLogoSvg';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { POPULAR_SEARCHES, getSimilarSuggestions } from '@/utils/searchConfig';
import { useFilters } from '@/hooks/useFilters';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import CategoryFilterModal from './CategoryFilterModal';
import { useModifiers } from '@/hooks/useModifiers';
import { Modifier } from '@/types/modifiers';
import dynamic from 'next/dynamic';
import { handleModifierSubmit } from '@/hooks/useModifierSubmit';

// Load heavy libraries dynamically
const ModifierModal = dynamic(() => import('../ModifierModal'), { ssr: false });

interface SearchOverlayProps {
  searchQuery: string;
  searchActive: boolean;
  filteredItems: MenuItemData[];
  handleSearch: (query: string) => void;
  onClose: () => void;
  onFilterSectionChange?: (
    section: 'categories' | 'dietTags' | 'price' | 'allergens' | null,
  ) => void;
  setFilteredItems: (items: MenuItemData[]) => void;
}

interface PriceRange {
  min: number;
  max: number;
}

interface Allergen {
  id: string;
  name: string;
  icon_url?: string;
}

const SearchOverlayComponent = forwardRef<HTMLDivElement, SearchOverlayProps>(
  (
    {
      searchQuery,
      searchActive,
      filteredItems,
      handleSearch,
      onClose,
      onFilterSectionChange,
      setFilteredItems,
    },
    ref,
  ) => {
    const cart = useContext(CartItemsContext);
    const cartActions = useContext(CartActionsContext);
    const cartTotal = useContext(CartTotalContext);
    const { alias } = useCustomer();
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);
    const { searchHistory, addToHistory } = useSearchHistory();
    const lastSearchRef = useRef<string>('');
    const { categories, dietTags, loading: filtersLoading } = useFilters();
    const [showFilters, setShowFilters] = useState(false);
    const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
    const [confirmedCategoryFilters, setConfirmedCategoryFilters] = useState<string[]>([]);
    const [activeDietTagFilters, setActiveDietTagFilters] = useState<string[]>([]);
    const [activeFilterSection, setActiveFilterSection] = useState<
      'categories' | 'dietTags' | 'price' | 'allergens' | null
    >(null);
    const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 100 });
    const [allergens, setAllergens] = useState<Allergen[]>([]);
    const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
    const [priceLimits, setPriceLimits] = useState<PriceRange>({ min: 0, max: 100 });
    const [allMenuItems, setAllMenuItems] = useState<MenuItemData[]>([]);

    // Estados para manejar modificadores
    const [showModifierModal, setShowModifierModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{
      id: string;
      name: string;
      description: string;
      allergens: MenuItemAllergen[];
      modifiers: Modifier[];
    } | null>(null);
    const { modifiers, fetchModifiers } = useModifiers();

    // Efecto para cargar los límites de precio y alérgenos
    useEffect(() => {
      async function loadFilterData() {
        try {
          // Obtener límites de precio
          const { data: priceData, error: priceError } = await supabase
            .from('menu_items')
            .select('price')
            .eq('is_available', true);

          if (priceError) throw priceError;

          const prices = priceData.map((item) => item.price);
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));

          setPriceLimits({ min: minPrice, max: maxPrice });
          setPriceRange({ min: minPrice, max: maxPrice });

          // Obtener alérgenos
          const { data: allergensData, error: allergensError } = await supabase
            .from('allergens')
            .select('id, name, icon_url')
            .order('name');

          if (allergensError) throw allergensError;
          setAllergens(allergensData || []);
        } catch (err) {
          console.error('Error loading filter data:', err);
        }
      }

      if (showFilters) {
        loadFilterData();
      }
    }, [showFilters]);

    // Efecto para manejar el visualViewport y el foco/scroll del input
    useEffect(() => {
      const visualViewport = window.visualViewport;

      const handleViewportResize = () => {
        if (visualViewport) {
          setViewportHeight(visualViewport.height);
          // Si el input está enfocado, intentar traerlo a la vista
          if (document.activeElement === inputRef.current) {
            setTimeout(() => {
              inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 150);
          }
        }
      };

      if (visualViewport) {
        setViewportHeight(visualViewport.height);
        visualViewport.addEventListener('resize', handleViewportResize);
        return () => {
          visualViewport.removeEventListener('resize', handleViewportResize);
        };
      }

      // Fallback si visualViewport no está disponible
      setViewportHeight(window.innerHeight);
      window.addEventListener('resize', handleViewportResize);
      return () => window.removeEventListener('resize', handleViewportResize);
    }, []);

    // Efecto para manejar el foco inicial y scroll cuando se abre el overlay
    useEffect(() => {
      if (searchActive && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }, [searchActive]);

    // Efecto para controlar el estado de búsqueda
    useEffect(() => {
      const isCurrentlySearching = searchQuery.trim().length >= 3;
      setIsSearching(isCurrentlySearching);

      const timer = isCurrentlySearching
        ? setTimeout(() => {
            setIsSearching(false);
          }, 300)
        : undefined;

      return () => {
        if (timer) clearTimeout(timer);
      };
    }, [searchQuery]);

    // Efecto para guardar en el historial cuando hay resultados
    useEffect(() => {
      const trimmedQuery = searchQuery.trim();
      if (
        trimmedQuery.length >= 3 &&
        filteredItems.length > 0 &&
        lastSearchRef.current !== trimmedQuery
      ) {
        lastSearchRef.current = trimmedQuery;
        addToHistory(trimmedQuery);
      }
    }, [filteredItems, searchQuery, addToHistory]);

    // Efecto para manejar la tecla Escape
    useEffect(() => {
      if (!searchActive) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [searchActive, onClose]);

    const handleItemClick = useCallback(
      async (itemId: string) => {
        const item = filteredItems.find((i) => i.id === itemId);
        if (!item) {
          console.error(`[SearchOverlay] Item con ID ${itemId} no encontrado en filteredItems.`);
          return;
        }
        if (!cartActions) {
          console.error('[SearchOverlay] Cart actions no están disponibles.');
          return;
        }

        console.log(`[SearchOverlay] Procesando item ${itemId}:`, {
          name: item.name,
          hasModifiers: item.modifiers?.length > 0,
          modifiersCount: item.modifiers?.length,
        });

        if (item.modifiers && item.modifiers.length > 0) {
          console.log(`[SearchOverlay] Item ${itemId} tiene modificadores, obteniendo detalles...`);
          await fetchModifiers(itemId);
          console.log(`[SearchOverlay] Modificadores obtenidos para ${itemId}:`, modifiers);

          setSelectedItem({
            id: item.id,
            name: item.name,
            description: item.description || '',
            allergens: item.allergens,
            modifiers: item.modifiers,
          });
          console.log(`[SearchOverlay] Mostrando modal de modificadores para ${itemId}`);
          setShowModifierModal(true);
          return;
        }

        console.log(`[SearchOverlay] Añadiendo item ${itemId} sin modificadores al carrito`);
        cartActions.handleAddToCart(itemId, {});
      },
      [filteredItems, fetchModifiers, cartActions, modifiers],
    );

    const handleAddToCart = useCallback(
      (itemId: string) => {
        console.log(`[SearchOverlay] handleAddToCart llamado para item ${itemId}`);
        handleItemClick(itemId);
      },
      [handleItemClick],
    );

    const handleRemoveFromCart = useCallback(
      (itemId: string) => {
        if (!cartActions) return;
        console.log(`[SearchOverlay] Eliminando item ${itemId} del carrito`);
        cartActions.handleDecrementCart(itemId, {});
      },
      [cartActions],
    );

    const onModifierSubmit = useCallback(
      (options: Record<string, string[]>) => {
        if (selectedItem && cartActions) {
          console.log(
            `[SearchOverlay] Procesando selección de modificadores para ${selectedItem.id}:`,
            {
              itemName: selectedItem.name,
              selectedOptions: options,
            },
          );

          handleModifierSubmit(
            selectedItem,
            options,
            modifiers,
            cartActions.handleAddToCart,
            () => {
              console.log(
                `[SearchOverlay] Cerrando modal de modificadores para ${selectedItem.id}`,
              );
              setShowModifierModal(false);
              setSelectedItem(null);
            },
          );
        }
      },
      [selectedItem, modifiers, cartActions],
    );

    const getCartQuantityForItem = useCallback(
      (itemId: string) => {
        if (!cart || !alias) return 0;
        let totalQuantity = 0;
        Object.values(cart).forEach((item) => {
          if (item.id === itemId && item.client_alias === alias) {
            totalQuantity += item.quantity;
          }
        });
        return totalQuantity;
      },
      [cart, alias],
    );

    // Obtener sugerencias similares cuando no hay resultados
    const similarSuggestions =
      searchQuery.trim().length >= 3 && filteredItems.length === 0
        ? getSimilarSuggestions(searchQuery, filteredItems)
        : [];

    const handleCategoryFilter = (categoryId: string) => {
      console.log('SearchOverlay - handleCategoryFilter - Categoría seleccionada:', categoryId);
      setActiveCategoryFilters((prev) => {
        const newSelection = prev.includes(categoryId)
          ? prev.filter((id) => id !== categoryId)
          : [...prev, categoryId];
        console.log('SearchOverlay - Nueva selección de categorías:', newSelection);
        return newSelection;
      });
    };

    const handleCategoryFilterChange = async (selectedCategories: string[]) => {
      console.log(
        'SearchOverlay - handleCategoryFilterChange - Categorías seleccionadas:',
        selectedCategories,
      );

      try {
        // Consulta a la base de datos para obtener los artículos que pertenecen a las categorías seleccionadas
        const { data: items, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .overlaps('category_ids', selectedCategories);

        if (error) throw error;

        console.log('SearchOverlay - Artículos filtrados desde BD:', items);
        setFilteredItems(items || []);
        setConfirmedCategoryFilters(selectedCategories);
      } catch (err) {
        console.error('Error al filtrar artículos por categorías:', err);
      }
    };

    const handleDietTagFilter = (dietTagId: string) => {
      setActiveDietTagFilters((prev) =>
        prev.includes(dietTagId) ? prev.filter((id) => id !== dietTagId) : [...prev, dietTagId],
      );
    };

    const handleAllergenExclusion = (allergenId: string) => {
      setExcludedAllergens((prev) =>
        prev.includes(allergenId) ? prev.filter((id) => id !== allergenId) : [...prev, allergenId],
      );
    };

    const handlePriceChange = (type: 'min' | 'max', value: number) => {
      setPriceRange((prev) => ({
        ...prev,
        [type]: value,
      }));
    };

    const applyFilters = (items: MenuItemData[]) => {
      let filtered = [...items];

      // Aplicar filtros de categoría
      if (activeCategoryFilters.length > 0) {
        filtered = filtered.filter((item) =>
          item.category_ids?.some((catId) => activeCategoryFilters.includes(catId)),
        );
      }

      // Aplicar filtros de etiquetas dietéticas
      if (activeDietTagFilters.length > 0) {
        filtered = filtered.filter((item) =>
          activeDietTagFilters.every((filterTagId) =>
            item.menu_item_diet_tags?.some((tag) => tag.diet_tags.id === filterTagId),
          ),
        );
      }

      // Aplicar filtro de precio
      filtered = filtered.filter(
        (item) => item.price >= priceRange.min && item.price <= priceRange.max,
      );

      // Aplicar filtro de alérgenos (exclusión)
      if (excludedAllergens.length > 0) {
        filtered = filtered.filter(
          (item) => !item.allergens?.some((allergen) => excludedAllergens.includes(allergen.id)),
        );
      }

      return filtered;
    };

    const filteredResults = applyFilters(filteredItems);

    const handleFilterSectionChange = (
      section: 'categories' | 'dietTags' | 'price' | 'allergens' | null,
    ) => {
      if (section === null) {
        // Si se cierra el modal sin guardar, reseteamos los filtros
        setActiveCategoryFilters(confirmedCategoryFilters);
      }
      setActiveFilterSection(section);
      onFilterSectionChange?.(section);
    };

    const FilterSection = ({
      title,
      items,
      activeItems,
      onToggle,
      type,
      children,
    }: {
      title: string;
      items?: { id: string; name: string }[];
      activeItems?: string[];
      onToggle?: (id: string) => void;
      type: 'categories' | 'dietTags' | 'price' | 'allergens';
      children?: React.ReactNode;
    }) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          {activeItems && (
            <span className="text-sm text-gray-500">{activeItems.length} seleccionados</span>
          )}
        </div>
        {children || (
          <div className="grid grid-cols-2 gap-3">
            {items?.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => onToggle?.(item.id)}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border transition-all ${
                  activeItems?.includes(item.id)
                    ? 'border-[#1ce3cf] bg-[#e0f2f1] text-[#00796b]'
                    : 'border-gray-200 hover:border-[#1ce3cf] hover:bg-[#f5f9f9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.name}</span>
                  {activeItems?.includes(item.id) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-[#1ce3cf] flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    );

    return (
      <AnimatePresence>
        {searchActive && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-lg"
            style={{ height: '100vh' }}
          >
            <header
              className="flex items-center justify-between bg-white px-4 mb-2"
              style={{
                height: 'var(--header-height)',
                paddingTop: 'calc(var(--safe-area-top) + 1rem)',
                paddingBottom: '0.5rem',
                width: '100%',
                maxWidth: '100vw',
              }}
            >
              <div className="flex items-center h-16 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="w-16 h-16 flex items-center justify-center text-[#4f968f] hover:text-[#0e1b19] transition-colors"
                  aria-label="Cerrar búsqueda"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 flex justify-center min-w-0">
                <div className="h-16 flex items-center w-[200px]">
                  <TextLogoSvg className="h-12 w-auto" />
                </div>
              </div>

              <div className="flex items-center h-16 flex-shrink-0">
                <div className="w-16 h-16" />
              </div>
            </header>

            <div className="p-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar"
                  className="w-full pl-12 pr-10 py-3 text-lg rounded-full border-[1px] border-[#d0e6e4] focus:outline-none focus:ring-2 focus:ring-[#1ce3cf] focus:border-transparent"
                  style={{ fontFamily: 'Epilogue, "Noto Sans", sans-serif' }}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4f968f]" />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#4f968f] hover:text-[#0e1b19] transition-colors"
                    aria-label="Borrar búsqueda"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    handleFilterSectionChange(
                      activeFilterSection === 'categories' ? null : 'categories',
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    confirmedCategoryFilters.length > 0
                      ? 'bg-[#e0f2f1] text-[#00796b]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Categorías{' '}
                  {confirmedCategoryFilters.length > 0 && `(${confirmedCategoryFilters.length})`}
                  {confirmedCategoryFilters.length > 0 && (
                    <X
                      className="h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmedCategoryFilters([]);
                        setActiveCategoryFilters([]);
                      }}
                    />
                  )}
                </button>

                <button
                  onClick={() =>
                    handleFilterSectionChange(
                      activeFilterSection === 'dietTags' ? null : 'dietTags',
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeDietTagFilters.length > 0 || activeFilterSection === 'dietTags'
                      ? 'bg-[#e0f2f1] text-[#00796b]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Etiquetas {activeDietTagFilters.length > 0 && `(${activeDietTagFilters.length})`}
                  {activeDietTagFilters.length > 0 && (
                    <X
                      className="h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDietTagFilters([]);
                      }}
                    />
                  )}
                </button>

                <button
                  onClick={() =>
                    handleFilterSectionChange(activeFilterSection === 'price' ? null : 'price')
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    priceRange.min > priceLimits.min ||
                    priceRange.max < priceLimits.max ||
                    activeFilterSection === 'price'
                      ? 'bg-[#e0f2f1] text-[#00796b]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Precio{' '}
                  {priceRange.min > priceLimits.min || priceRange.max < priceLimits.max
                    ? '(Filtrado)'
                    : ''}
                  {(priceRange.min > priceLimits.min || priceRange.max < priceLimits.max) && (
                    <X
                      className="h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPriceRange({ min: priceLimits.min, max: priceLimits.max });
                      }}
                    />
                  )}
                </button>

                <button
                  onClick={() =>
                    handleFilterSectionChange(
                      activeFilterSection === 'allergens' ? null : 'allergens',
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    excludedAllergens.length > 0 || activeFilterSection === 'allergens'
                      ? 'bg-[#e0f2f1] text-[#00796b]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Alérgenos {excludedAllergens.length > 0 && `(${excludedAllergens.length})`}
                  {excludedAllergens.length > 0 && (
                    <X
                      className="h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExcludedAllergens([]);
                      }}
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <AnimatePresence mode="wait">
                {activeFilterSection === 'categories' ? (
                  <CategoryFilterModal
                    isOpen={true}
                    onClose={() => handleFilterSectionChange(null)}
                    categories={categories}
                    onCategoryFilter={handleCategoryFilter}
                    onModalClose={() => handleFilterSectionChange(null)}
                    onFilterChange={handleCategoryFilterChange}
                    selectedCategories={confirmedCategoryFilters}
                  />
                ) : (
                  <>
                    {(!searchQuery || searchQuery.trim().length < 3) &&
                    confirmedCategoryFilters.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
                        {searchHistory && searchHistory.length > 0 && (
                          <div className="w-full max-w-md mb-6">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">
                              Búsquedas Recientes
                            </h3>
                            <div className="flex flex-wrap justify-center gap-2">
                              {searchHistory.map((term, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSearch(term)}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                                >
                                  {term}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="text-md font-semibold text-gray-700 mb-2">
                            Quizás te interese...
                          </h3>
                          <div className="flex flex-wrap justify-center gap-2">
                            {POPULAR_SEARCHES.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSearch(suggestion.term)}
                                className="px-3 py-1.5 bg-[#e0f2f1] text-[#00796b] rounded-full text-sm hover:bg-[#b2dfdb] transition-colors flex items-center gap-1"
                              >
                                <span>{suggestion.icon}</span>
                                <span>{suggestion.term}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : isSearching ? (
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
                      <div className="space-y-2 pt-4">
                        {filteredItems.map((item) => {
                          const quantity = getCartQuantityForItem(item.id);
                          return (
                            <MenuItem
                              key={item.id}
                              {...item}
                              allergens={item.allergens}
                              onAddToCart={() => handleAddToCart(item.id)}
                              onRemoveFromCart={() => handleRemoveFromCart(item.id)}
                              quantity={quantity}
                              diet_tags={[]}
                              origin=""
                              pairing_suggestion=""
                              chef_notes=""
                              hasModifiers={item.modifiers?.length > 0}
                              onOpenCart={() => handleAddToCart(item.id)}
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
                        <p className="text-[#4f968f] text-center mb-2">
                          {searchQuery
                            ? `Vaya, no encontramos nada para "${searchQuery}"`
                            : 'No se encontraron artículos con los filtros seleccionados'}
                        </p>
                        {similarSuggestions.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[#4f968f] text-center text-sm mb-2">
                              ¿Quizás quisiste decir...?
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {similarSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSearch(suggestion)}
                                  className="px-3 py-1.5 bg-[#e0f2f1] text-[#00796b] rounded-full text-sm hover:bg-[#b2dfdb] transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-[#4f968f] text-center text-sm mb-4">
                          {searchQuery
                            ? 'Revisa la ortografía o intenta con términos más generales'
                            : 'Intenta con otras categorías'}
                        </p>
                        <button
                          onClick={onClose}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1ce3cf] text-white hover:bg-[#16b8a8] transition-colors mt-4"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>Volver</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showModifierModal && selectedItem && (
                <ModifierModal
                  isOpen={showModifierModal}
                  itemName={selectedItem.name}
                  itemDescription={selectedItem.description}
                  itemAllergens={selectedItem.allergens}
                  modifiers={modifiers}
                  menuItems={filteredItems}
                  onConfirm={onModifierSubmit}
                  onClose={() => {
                    setShowModifierModal(false);
                    setSelectedItem(null);
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

SearchOverlayComponent.displayName = 'SearchOverlay';
export default React.memo(SearchOverlayComponent);
