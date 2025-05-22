'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
  forwardRef,
} from 'react';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Search, X, ArrowLeft, UserCircle, ChefHat } from 'lucide-react';
import MenuItem from './MenuItem';
import MenuHeader from './MenuScreen/MenuHeader';
import FloatingCartButton from './MenuScreen/FloatingCartButton';
import SearchOverlay from './MenuScreen/SearchOverlay';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorScreen from './MenuScreen/ErrorScreen';
import CategoryTabs from './MenuScreen/CategoryTabs';
import CategorySection from './MenuScreen/CategorySection';
import { MenuItemData, Category, Slot, CartItem, Cart, SelectedModifiers } from '@/types/menu';
import { MenuItemAllergen, Modifier } from '@/types/modifiers';

import { CartItemsContext } from '@/context/CartItemsContext';
import { CartTotalContext } from '@/context/CartTotalContext';
import { CartActionsContext } from '@/context/CartActionsContext';

import { useModifiers } from '@/hooks/useModifiers';
import { handleModifierSubmit } from '@/hooks/useModifierSubmit';
import { searchMenuItems, resetSearch } from '@/utils/searchUtils';
import { useCustomer } from '@/context/CustomerContext';
import { useTable } from '@/context/TableContext';
import dynamic from 'next/dynamic';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '@/hooks/useDebounce';
import Image from 'next/image';
import { useMenuData, CategoryWithItems } from '@/hooks/useMenuData';
import SearchButton from './SearchButton';
import { useCategoryOrder } from '@/hooks/useCategoryOrder';
import { ChatIA } from './ChatIA';
import ChatButton from '@/components/chat/ChatButton';
import { TextLogoSvg } from '../TextLogoSvg';

// Load heavy libraries dynamically
const ModifierModal = dynamic(() => import('./ModifierModal'), { ssr: false });
const CartModal = dynamic(() => import('./CartModal'), { ssr: false });
const AliasModal = dynamic(
  () => import('@/components/ui/AliasModal').then((mod) => mod.AliasModal),
  { ssr: false },
);

export interface SelectedItem {
  id: string;
  name: string;
  description: string | null;
  allergens: MenuItemAllergen[];
  modifiers: Modifier[];
}

interface MenuScreenProps {
  initialSlots: Slot[];
  initialCategories: Category[];
  initialMenuItems: MenuItemData[];
  initialCurrentSlot: Slot | null;
}

const MenuScreenComponent = forwardRef<HTMLDivElement, MenuScreenProps>(
  ({ initialSlots, initialCategories, initialMenuItems, initialCurrentSlot }, ref) => {
    // 1. Context hooks primero
    const cart = useContext(CartItemsContext);
    const cartTotal = useContext(CartTotalContext);
    const cartActions = useContext(CartActionsContext);
    const { alias } = useCustomer();
    const { tableNumber } = useTable();

    // 2. Data fetching hooks
    const { slots, currentSlot, categories, loading, error, menuItems } = useMenuData();
    const { modifiers, fetchModifiers } = useModifiers();
    const orderedCategories = useCategoryOrder({
      categories,
      slots,
      currentSlot,
    });

    // 3. State hooks
    const [activeTab, setActiveTab] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const [showModifierModal, setShowModifierModal] = useState(false);
    const [showCartModal, setShowCartModal] = useState(false);
    const [searchActive, setSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredItems, setFilteredItems] = useState<MenuItemData[]>([]);
    const [showAliasModal, setShowAliasModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [isAnyDetailOpen, setIsAnyDetailOpen] = useState(false);

    // 4. Refs
    const menuScrollRef = useRef<HTMLDivElement | null>(null);
    const isScrollingProgrammatically = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // 5. Memoized values
    const memoizedCartActions = useMemo(() => cartActions, [cartActions]);
    const memoizedInitialMenuItems = useMemo(() => initialMenuItems, [initialMenuItems]);
    const memoizedModifiers = useMemo(() => modifiers, [modifiers]);

    const itemQuantities = useMemo(
      () =>
        Object.entries(cart || {}).reduce(
          (quantities, [id, item]: [string, CartItem]) => {
            if (item.client_alias === alias) {
              quantities[id] = item.quantity;
            }
            return quantities;
          },
          {} as Record<string, number>,
        ),
      [cart, alias],
    );

    const handleItemClick = useCallback(
      async (itemId: string) => {
        const item = memoizedInitialMenuItems?.find((i) => i.id === itemId);
        if (!item) {
          console.error(`[MenuScreen] Item con ID ${itemId} no encontrado en initialMenuItems.`);
          return;
        }
        if (!memoizedCartActions) {
          console.error('[MenuScreen] Cart actions no están disponibles.');
          return;
        }

        if (item.modifiers && item.modifiers.length > 0) {
          await fetchModifiers(itemId);
          setSelectedItem({
            id: item.id,
            name: item.name,
            description: item.description,
            allergens: item.allergens,
            modifiers: item.modifiers,
          });
          setShowModifierModal(true);
          return;
        }

        console.log(`[MenuScreen] Añadiendo item ${itemId} sin modificadores.`);
        memoizedCartActions.handleAddToCart(itemId, {});
      },
      [memoizedInitialMenuItems, fetchModifiers, memoizedCartActions],
    );

    const onModifierSubmit = useCallback(
      (options: Record<string, string[]>) => {
        if (selectedItem && memoizedCartActions) {
          handleModifierSubmit(
            selectedItem,
            options,
            memoizedModifiers,
            memoizedCartActions.handleAddToCart,
            () => {
              setShowModifierModal(false);
              setSelectedItem(null);
            },
          );
        } else {
          console.error(
            '[MenuScreen] No se pudo procesar modificadores: falta selectedItem o cartActions.',
          );
        }
      },
      [selectedItem, memoizedModifiers, memoizedCartActions],
    );

    const handleDecrementItem = useCallback(
      (itemId: string, itemModifiers: SelectedModifiers | null = null) => {
        if (!memoizedCartActions) {
          console.error('[MenuScreen] Cart actions no están disponibles para decrementar.');
          return;
        }
        console.log(`[MenuScreen] Decrementando item ${itemId}. Modifiers:`, itemModifiers);
        memoizedCartActions.handleDecrementCart(itemId, itemModifiers ?? {});
      },
      [memoizedCartActions],
    );

    const handleScroll = useCallback(() => {
      if (isScrollingProgrammatically.current) return;

      const container = document.scrollingElement || document.documentElement;
      const scrollTop = container.scrollTop;
      const viewportHeight = window.innerHeight;
      const scrollBottom = scrollTop + viewportHeight;
      const tolerance = 50;

      // Obtener el offset del header usando variables CSS
      const headerHeight =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) ||
        64;
      const safeAreaTop =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top')) ||
        0;
      const headerOffset = headerHeight + safeAreaTop;

      let mostVisibleCategory: string | null = null;
      let maxVisibility = 0;

      Object.entries(categoryRefs.current).forEach(([id, element]) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + scrollTop;
          const elementBottom = elementTop + rect.height;

          // Calcular la visibilidad considerando el header
          const visibleTop = Math.max(elementTop, scrollTop + headerOffset);
          const visibleBottom = Math.min(elementBottom, scrollBottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);

          // Bonus por estar cerca del centro del viewport
          const elementCenter = elementTop + rect.height / 2;
          const viewportCenter = scrollTop + viewportHeight / 2;
          const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
          const centerBonus = Math.max(0, 1 - distanceFromCenter / (viewportHeight / 2));

          // Bonus por ser el último elemento y estar cerca del final
          const isLastElement = id === orderedCategories[orderedCategories.length - 1].id;
          const isNearBottom = scrollBottom >= container.scrollHeight - tolerance;
          const lastElementBonus = isLastElement && isNearBottom ? 1 : 0;

          const totalVisibility = visibleHeight + centerBonus * 100 + lastElementBonus * 200;

          if (totalVisibility > maxVisibility) {
            maxVisibility = totalVisibility;
            mostVisibleCategory = id;
          }
        }
      });

      if (mostVisibleCategory && mostVisibleCategory !== activeTab) {
        setActiveTab(mostVisibleCategory);
      }
    }, [orderedCategories, activeTab]);

    useEffect(() => {
      window.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleCategoryClick = useCallback((categoryId: string) => {
      setActiveTab(categoryId);
      const categoryElement = document.getElementById(`category-${categoryId}`);

      if (categoryElement) {
        isScrollingProgrammatically.current = true;

        // Obtener el offset del header usando variables CSS
        const headerHeight =
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
          ) || 64;
        const safeAreaTop =
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top'),
          ) || 0;
        const headerOffset = headerHeight + safeAreaTop;

        // Logs para verificar valores
        console.log('Debug offsets:', {
          headerHeight,
          safeAreaTop,
          headerOffset,
          elementTop: categoryElement.getBoundingClientRect().top,
          offsetTop: categoryElement.offsetTop,
        });

        // Usar scrollIntoView con un offset personalizado
        categoryElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        // Ajustar el scroll después de que se complete la animación
        setTimeout(() => {
          window.scrollBy(0, -headerOffset);
        }, 100);

        // Resetear la bandera después de la animación
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 500);
      }
    }, []);

    const debouncedSearch = useDebounce((query: string) => {
      const results = searchMenuItems(query, menuItems);
      setFilteredItems(results);
    }, 300);

    const handleSearch = useCallback(
      (query: string) => {
        setSearchQuery(query);
        debouncedSearch(query);
      },
      [debouncedSearch],
    );

    const handleResetSearch = useCallback(() => {
      resetSearch(setSearchQuery, setFilteredItems, setSearchActive);
    }, []);

    const handleAliasConfirm = useCallback(async (newAlias: string) => {
      console.log('[MenuScreen] Guardando alias:', newAlias);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      setShowAliasModal(false);
      return true;
    }, []);

    useEffect(() => {
      if (!searchActive) {
        resetSearch(setSearchQuery, setFilteredItems, setSearchActive);
      }
    }, [currentSlot, activeTab, searchActive]);

    useEffect(() => {
      if (searchActive) {
        // Solo cuando la búsqueda está activa, aplicamos estilos restrictivos
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100vh';
      } else {
        // Cuando la búsqueda no está activa, ELIMINAMOS los estilos en línea
        // permitiendo que globals.css tome el control
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
      }

      // La función de limpieza se ejecutará cuando searchActive cambie o el componente se desmonte.
      // Queremos asegurarnos de que, al final, los estilos de globals.css prevalezcan.
      return () => {
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
      };
    }, [searchActive]);

    useEffect(() => {
      if (orderedCategories.length === 0 || activeTab) return;
      setActiveTab(orderedCategories[0].id);
    }, [orderedCategories, activeTab]);

    const menuHeaderProps = useMemo(
      () => ({
        alias,
        tableNumber,
        onAliasClick: () => setShowAliasModal(true),
        setSearchActive,
        onChat: () => setShowChatModal(true),
        searchActive,
        style: { display: isAnyDetailOpen ? 'none' : undefined },
      }),
      [alias, tableNumber, isAnyDetailOpen, searchActive],
    );

    const categoryTabsProps = useMemo(
      () => ({
        categories: orderedCategories,
        activeTab,
        setActiveTab: handleCategoryClick,
      }),
      [orderedCategories, activeTab, handleCategoryClick],
    );

    const floatingCartButtonProps = useMemo(
      () => ({
        onClick: () => setShowCartModal(true),
      }),
      [],
    );

    const searchOverlayProps = useMemo(
      () => ({
        searchQuery,
        searchActive,
        filteredItems,
        handleSearch,
        onClose: handleResetSearch,
      }),
      [searchQuery, searchActive, filteredItems, handleSearch, handleResetSearch],
    );

    // 2. Función para renderizar el contenido condicional
    const renderContent = () => {
      if (loading && categories.length === 0) {
        return <LoadingScreen message="Cargando menú..." />;
      }

      if (error) {
        return <ErrorScreen error={error.message} />;
      }

      if (cart === null || cartTotal === null || !cartActions) {
        return <LoadingScreen message="Inicializando carrito..." />;
      }

      return (
        <div
          ref={menuScrollRef}
          className="menu-screen-container flex-grow"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header fijo */}
          <header className="menu-header" suppressHydrationWarning>
            <MenuHeader {...menuHeaderProps} />
          </header>

          {/* Pestañas de categorías fijas */}
          <nav className="category-tabs" suppressHydrationWarning>
            <CategoryTabs {...categoryTabsProps} />
          </nav>

          {/* Contenido principal scrolleable */}
          <main
            className="flex-grow relative overflow-y-auto overflow-x-hidden"
            style={{
              paddingTop: 'var(--content-offset-top)',
              paddingBottom: 'calc(80px + var(--safe-area-bottom))',
            }}
            suppressHydrationWarning
          >
            {orderedCategories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                onAddToCart={handleItemClick}
                onRemoveFromCart={handleDecrementItem}
                itemQuantities={itemQuantities}
                onOpenCart={() => setShowCartModal(true)}
                ref={(el) => {
                  categoryRefs.current[category.id] = el;
                }}
              />
            ))}
          </main>

          {/* Botón flotante del carrito */}
          <FloatingCartButton {...floatingCartButtonProps} />

          {/* Overlays y Modales */}
          <AnimatePresence>
            {searchActive && <SearchOverlay {...searchOverlayProps} />}

            {showModifierModal && selectedItem && (
              <ModifierModal
                isOpen={showModifierModal}
                itemName={selectedItem.name}
                itemDescription={selectedItem.description ?? undefined}
                itemAllergens={selectedItem.allergens as MenuItemAllergen[]}
                modifiers={memoizedModifiers as Modifier[]}
                menuItems={memoizedInitialMenuItems ?? []}
                onConfirm={onModifierSubmit}
                onClose={() => {
                  setShowModifierModal(false);
                  setSelectedItem(null);
                }}
              />
            )}

            {showCartModal && (
              <CartModal
                onClose={() => setShowCartModal(false)}
                currentClientAlias={alias ?? undefined}
              />
            )}

            {showAliasModal && (
              <AliasModal
                isOpen={showAliasModal}
                onClose={() => setShowAliasModal(false)}
                onConfirm={async (alias, wantsFullscreen) => {
                  setShowAliasModal(false);
                  return true;
                }}
              />
            )}

            {showChatModal && (
              <ChatIA
                isOpen={showChatModal}
                onClose={() => setShowChatModal(false)}
                userAlias={alias ?? 'Cliente'}
              />
            )}
          </AnimatePresence>
        </div>
      );
    };

    return renderContent();
  },
);

MenuScreenComponent.displayName = 'MenuScreen';
export default React.memo(MenuScreenComponent);
