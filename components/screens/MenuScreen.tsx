'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, useContext, forwardRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Search, X, ArrowLeft, UserCircle, ChefHat } from 'lucide-react';
import MenuItem from './MenuItem';
import MenuHeader from './MenuScreen/MenuHeader';
import FloatingCartButton from './MenuScreen/FloatingCartButton';
import SearchOverlay from './MenuScreen/SearchOverlay';
import LoadingScreen from './MenuScreen/LoadingScreen';
import ErrorScreen from './MenuScreen/ErrorScreen';
import CategoryTabs from './MenuScreen/CategoryTabs';
import CategorySection from './MenuScreen/CategorySection';
import { MenuItemData, Category, Slot, CartItem, Cart, SelectedModifiers, Modifier, MenuItemAllergen } from '@/types/menu';

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
  description: string;
  allergens: MenuItemAllergen[];
  modifiers: Modifier[];
}

interface MenuScreenProps {
  initialSlots: Slot[];
  initialCategories: Category[];
  initialMenuItems: MenuItemData[];
  initialCurrentSlot: Slot | null;
}

const MenuScreenComponent = forwardRef<HTMLDivElement, MenuScreenProps>(({
  initialSlots,
  initialCategories,
  initialMenuItems,
  initialCurrentSlot
}, ref) => {
  const { slots, currentSlot, categories, loading, error } = useMenuData();
  const orderedCategories = useCategoryOrder({
    categories,
    slots,
    currentSlot
  });
  const [activeTab, setActiveTab] = useState<string>('');
  const menuScrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MenuItemData[]>([]);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const isScrollingProgrammatically = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  const cart = useContext(CartItemsContext);
  const cartTotal = useContext(CartTotalContext);
  const cartActions = useContext(CartActionsContext);

  const { alias } = useCustomer();
  const { tableNumber } = useTable();

  const { modifiers, fetchModifiers } = useModifiers();

  const memoizedCartActions = useMemo(() => cartActions, [cartActions]);
  const memoizedInitialMenuItems = useMemo(() => initialMenuItems, [initialMenuItems]);
  const memoizedModifiers = useMemo(() => modifiers, [modifiers]);

  const itemQuantities = useMemo(() => {
    if (!cart || !alias) return {};
    const quantities: Record<string, number> = {};
    Object.entries(cart).forEach(([id, item]) => {
      if (item.client_alias === alias) {
        quantities[id] = item.quantity;
      }
    });
    return quantities;
  }, [cart, alias]);

  const handleItemClick = useCallback(
    async (itemId: string) => {
      const item = memoizedInitialMenuItems?.find((i) => i.id === itemId);
      if (!item) {
        console.error(`[MenuScreen] Item con ID ${itemId} no encontrado en initialMenuItems.`);
        return;
      }
      if (!memoizedCartActions) {
        console.error("[MenuScreen] Cart actions no están disponibles.");
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
          }
        );
      } else {
        console.error("[MenuScreen] No se pudo procesar modificadores: falta selectedItem o cartActions.");
      }
    },
    [selectedItem, memoizedModifiers, memoizedCartActions],
  );

  const handleDecrementItem = useCallback(
    (itemId: string, itemModifiers: SelectedModifiers | null = null) => {
      if (!memoizedCartActions) {
        console.error("[MenuScreen] Cart actions no están disponibles para decrementar.");
        return;
      }
      console.log(`[MenuScreen] Decrementando item ${itemId}. Modifiers:`, itemModifiers);
      memoizedCartActions.handleDecrementCart(itemId, itemModifiers ?? {});
    },
    [memoizedCartActions]
  );

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveTab(categoryId);
    const categoryElement = document.getElementById(`category-${categoryId}`);
    if (categoryElement) {
      isScrollingProgrammatically.current = true;
      categoryElement.scrollIntoView({ behavior: 'smooth' });
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 1000);
    }
  }, []);

  const debouncedSearch = useDebounce((query: string) => {
    const results = searchMenuItems(query, memoizedInitialMenuItems);
    setFilteredItems(results);
  }, 300);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

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
  }, [currentSlot, activeTab]);

  useEffect(() => {
    if (searchActive) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100vh';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
    };
  }, [searchActive]);

  // Set first category as active when orderedCategories changes
  useEffect(() => {
    if (orderedCategories.length > 0 && !activeTab) {
      setActiveTab(orderedCategories[0].id);
    }
  }, [orderedCategories, activeTab]);

  const menuHeaderProps = useMemo(() => ({
    alias,
    tableNumber,
    currentSlot,
    slots,
    onAliasClick: () => setShowAliasModal(true),
    setSearchActive,
  }), [alias, tableNumber, currentSlot, slots]);

  const categoryTabsProps = useMemo(() => ({
    categories: orderedCategories,
    activeTab,
    setActiveTab: handleCategoryClick,
    menuScrollRef: menuScrollRef as React.RefObject<HTMLDivElement>,
  }), [orderedCategories, activeTab, handleCategoryClick]);

  const floatingCartButtonProps = useMemo(() => ({
    onClick: () => setShowCartModal(true),
    getTotalItems: memoizedCartActions?.getTotalItems,
    cartTotal,
  }), [memoizedCartActions, cartTotal]);

  const searchOverlayProps = useMemo(() => ({
    searchQuery,
    searchActive,
    filteredItems,
    handleSearch,
    onClose: handleResetSearch,
  }), [searchQuery, searchActive, filteredItems, handleSearch, handleResetSearch]);

  if (loading && categories.length === 0) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error.message} />;
  }

  if (cart === null || cartTotal === null || !cartActions) {
    console.warn("[MenuScreen] Esperando contextos del carrito...");
    return <LoadingScreen message="Inicializando carrito..." />;
  }

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-hidden">
      <MenuHeader {...menuHeaderProps} />

      <div
        ref={menuScrollRef}
        className="fixed top-[120px] bottom-0 left-0 right-0 overflow-y-auto no-scrollbar pb-20"
      >
        <CategoryTabs {...categoryTabsProps} />

        {orderedCategories.map((category: CategoryWithItems) => (
          <CategorySection
            key={category.id}
            category={category}
            itemQuantities={itemQuantities}
            onAddToCart={handleItemClick}
            onRemoveFromCart={handleDecrementItem}
            onOpenCart={() => setShowCartModal(true)}
          />
        ))}
      </div>

      <div className="fixed bottom-4 left-4 right-4 flex items-center gap-4">
        <FloatingCartButton {...floatingCartButtonProps} />
        <ChatButton onClick={() => setShowChatModal(true)} />
      </div>

      <SearchButton onClick={() => setSearchActive(true)} />

      <SearchOverlay {...searchOverlayProps} />

      {showModifierModal && selectedItem && (
        <ModifierModal
          isOpen={showModifierModal}
          itemName={selectedItem.name}
          itemDescription={selectedItem.description}
          itemAllergens={selectedItem.allergens}
          modifiers={memoizedModifiers}
          menuItems={memoizedInitialMenuItems ?? []}
          onConfirm={onModifierSubmit}
          onClose={() => { setShowModifierModal(false); setSelectedItem(null); }}
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
          onConfirm={handleAliasConfirm}
        />
      )}

      <ChatIA
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        alias={alias ?? 'Cliente'}
      />

      <style jsx global>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes colorChange {
          0% { color: #ffffff; }
          16.6% { color: #fef3c7; }
          33.3% { color: #fbbf24; }
          50% { color: #f59e0b; }
          66.6% { color: #d97706; }
          83.3% { color: #b45309; }
          100% { color: #ffffff; }
        }
      `}</style>
    </div>
  );
});

MenuScreenComponent.displayName = "MenuScreen";
export default React.memo(MenuScreenComponent);
