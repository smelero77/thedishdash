'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Search, X, ArrowLeft, UserCircle } from 'lucide-react';
import MenuItem from './MenuItem';
import MenuHeader from './MenuScreen/MenuHeader';
import FloatingCartButton from './MenuScreen/FloatingCartButton';
import SearchOverlay from './MenuScreen/SearchOverlay';
import LoadingScreen from './MenuScreen/LoadingScreen';
import ErrorScreen from './MenuScreen/ErrorScreen';
import CategoryTabs from './MenuScreen/CategoryTabs';
import { CategorySection } from './MenuScreen/CategorySection';
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
import useMenuData, { CategoryWithItems } from '@/hooks/useMenuData';
import SearchButton from './SearchButton';

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

export default function MenuScreen({
  initialSlots,
  initialCategories,
  initialMenuItems,
  initialCurrentSlot,
}: MenuScreenProps) {
  const { slots, currentSlot, categories, loading, error } = useMenuData();
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

  const cart = useContext(CartItemsContext);
  const cartTotal = useContext(CartTotalContext);
  const cartActions = useContext(CartActionsContext);

  const { alias } = useCustomer();
  const { tableNumber } = useTable();

  const { modifiers, fetchModifiers } = useModifiers();

  const handleItemClick = useCallback(
    async (itemId: string) => {
      const item = initialMenuItems?.find((i) => i.id === itemId);
      if (!item) {
        console.error(`[MenuScreen] Item con ID ${itemId} no encontrado en initialMenuItems.`);
        return;
      }
      if (!cartActions) {
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
      cartActions.handleAddToCart(itemId, {});
    },
    [initialMenuItems, fetchModifiers, cartActions],
  );

  const onModifierSubmit = useCallback(
    (options: Record<string, string[]>) => {
      if (selectedItem && cartActions) {
        handleModifierSubmit(
          selectedItem,
          options,
          modifiers,
          cartActions.handleAddToCart,
          () => {
            setShowModifierModal(false);
            setSelectedItem(null);
          }
        );
      } else {
        console.error("[MenuScreen] No se pudo procesar modificadores: falta selectedItem o cartActions.");
      }
    },
    [selectedItem, modifiers, cartActions],
  );

  const handleDecrementItem = useCallback(
    (itemId: string, itemModifiers: SelectedModifiers | null = null) => {
      if (!cartActions) {
        console.error("[MenuScreen] Cart actions no están disponibles para decrementar.");
        return;
      }
      console.log(`[MenuScreen] Decrementando item ${itemId}. Modifiers:`, itemModifiers);
      cartActions.handleDecrementCart(itemId, itemModifiers ?? {});
    },
    [cartActions]
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
    const results = searchMenuItems(query, initialMenuItems);
    setFilteredItems(results);
  }, 300);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

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

  const handleAliasConfirm = async (newAlias: string) => {
    console.log('[MenuScreen] Guardando alias:', newAlias);
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    setShowAliasModal(false);
    return true;
  };

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
      <MenuHeader
        alias={alias}
        tableNumber={tableNumber}
        currentSlot={currentSlot}
        slots={slots}
        onAliasClick={() => setShowAliasModal(true)}
        setSearchActive={setSearchActive}
      />

      <div
        ref={menuScrollRef}
        className="fixed top-[120px] bottom-0 left-0 right-0 overflow-y-auto no-scrollbar pb-20"
      >
        <CategoryTabs
          categories={categories}
          activeTab={activeTab}
          setActiveTab={handleCategoryClick}
          menuScrollRef={menuScrollRef as React.RefObject<HTMLDivElement>}
        />

        {categories.map((category: CategoryWithItems) => (
          <CategorySection
            key={category.id}
            category={category}
            onAddToCart={(item: MenuItemData) => handleItemClick(item.id)}
            onRemoveFromCart={(item: MenuItemData) => handleDecrementItem(item.id)}
          />
        ))}
      </div>

      <FloatingCartButton
        onClick={() => setShowCartModal(true)}
        getTotalItems={cartActions?.getTotalItems}
        cartTotal={cartTotal}
      />

      <SearchButton onClick={() => setSearchActive(true)} />

      <SearchOverlay
        searchQuery={searchQuery}
        searchActive={searchActive}
        filteredItems={filteredItems}
        handleSearch={handleSearch}
        onClose={() => resetSearch(setSearchQuery, setFilteredItems, setSearchActive)}
        onAddToCart={handleItemClick}
        onRemoveItem={handleDecrementItem}
        cart={cart}
        resetSearch={() => resetSearch(setSearchQuery, setFilteredItems, setSearchActive)}
      />

      {showModifierModal && selectedItem && modifiers?.length > 0 && ReactDOM.createPortal(
        <ModifierModal
          isOpen={showModifierModal}
          itemName={selectedItem.name}
          itemDescription={selectedItem.description}
          itemAllergens={selectedItem.allergens}
          modifiers={modifiers}
          menuItems={initialMenuItems ?? []}
          onConfirm={onModifierSubmit}
          onClose={() => { setShowModifierModal(false); setSelectedItem(null); }}
        />,
        document.body
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
    </div>
  );
}
