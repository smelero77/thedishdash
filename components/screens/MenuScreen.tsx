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
    const [isScrolling, setIsScrolling] = useState(false);

    // 4. Refs
    const menuScrollRef = useRef<HTMLDivElement | null>(null);
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

    const handleAddToCart = useCallback(
      (itemId: string) => {
        if (!memoizedCartActions) return;
        memoizedCartActions.handleAddToCart(itemId);
      },
      [memoizedCartActions],
    );

    const handleRemoveFromCart = useCallback(
      (itemId: string, itemModifiers?: SelectedModifiers | null) => {
        if (!memoizedCartActions) return;
        memoizedCartActions.handleDecrementCart(itemId, itemModifiers ?? {});
      },
      [memoizedCartActions],
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
        }
      },
      [selectedItem, memoizedModifiers, memoizedCartActions],
    );

    const handleScroll = useCallback(() => {
      // Observador que "ve" qué sección está entrando en el viewport
      const observer = new IntersectionObserver(
        (entries) => {
          if (isScrolling) return; // No actualizar si estamos en medio de un scroll programado
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.id.replace('category-', '');
              setActiveTab(id);
            }
          });
        },
        {
          root: null, // viewport de ventana
          rootMargin: '-112px 0px -50% 0px', // 112px arriba (header + tabs) y 50% abajo
          threshold: 0.1, // Solo necesita ser 10% visible
        },
      );

      // Observar todas las secciones
      orderedCategories.forEach((cat) => {
        const el = categoryRefs.current[cat.id];
        if (el) observer.observe(el);
      });

      return () => observer.disconnect();
    }, [orderedCategories, isScrolling]);

    // Inicializar el IntersectionObserver cuando cambien las categorías
    useEffect(() => {
      const cleanup = handleScroll();
      return () => {
        if (cleanup) cleanup();
      };
    }, [handleScroll]);

    // Manejar el click en una pestaña
    const handleTabClick = useCallback((id: string) => {
      setIsScrolling(true);
      setActiveTab(id);
      // Reactivar el IntersectionObserver después de 1 segundo
      setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    }, []);

    const categoryTabsProps = useMemo(
      () => ({
        categories: orderedCategories,
        activeTab,
        onTabClick: handleTabClick,
      }),
      [orderedCategories, activeTab, handleTabClick],
    );

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
        // Solo cuando la búsqueda está activa, bloqueamos el scroll
        document.documentElement.style.overflow = 'hidden';
      } else {
        // Cuando la búsqueda no está activa, permitimos que globals.css maneje el scroll
        document.documentElement.style.overflow = '';
      }

      return () => {
        document.documentElement.style.overflow = '';
      };
    }, [searchActive]);

    useEffect(() => {
      if (orderedCategories.length === 0) return;
      setActiveTab(orderedCategories[0].id);
    }, [orderedCategories]);

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
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* 1) Header pegado */}
          <header className="menu-header">
            <MenuHeader {...menuHeaderProps} />
          </header>

          {/* 2) Tabs pegadas justo debajo */}
          <nav className="category-tabs">
            <CategoryTabs {...categoryTabsProps} />
          </nav>

          {/* 3) Contenido principal: el scroll es del window */}
          <main
            className="flex-grow relative"
            style={{
              paddingTop: 'var(--content-offset-top)',
              paddingBottom: 'calc(80px + var(--safe-area-bottom))',
            }}
          >
            {orderedCategories.map((cat) => (
              <CategorySection
                id={`category-${cat.id}`}
                key={cat.id}
                category={cat}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                itemQuantities={itemQuantities}
                onOpenCart={() => setShowCartModal(true)}
                ref={(el) => {
                  categoryRefs.current[cat.id] = el;
                }}
              />
            ))}
          </main>

          <FloatingCartButton {...floatingCartButtonProps} />
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
