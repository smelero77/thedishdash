'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Search, X, ArrowLeft, UserCircle } from 'lucide-react';
import MenuItem from './MenuItem';
import { useSearchParams } from 'next/navigation';
import MenuHeader from './MenuScreen/MenuHeader';
import FloatingCartButton from './MenuScreen/FloatingCartButton';
import SearchOverlay from './MenuScreen/SearchOverlay';
import LoadingScreen from './MenuScreen/LoadingScreen';
import ErrorScreen from './MenuScreen/ErrorScreen';
import CategoryTabs from './MenuScreen/CategoryTabs';
import CategorySection from './MenuScreen/CategorySection';
import { MenuItemData, Category, Slot } from '@/types/menu';
import { useCartContext } from '@/context/CartContext';
import { useModifiers } from '@/hooks/useModifiers';
import { validateTableCode } from '@/lib/data';
import { handleModifierSubmit } from '@/hooks/useModifierSubmit';
import { searchMenuItems, resetSearch } from '@/utils/searchUtils';
import { useCustomer } from '@/context/CustomerContext';
import { useTable } from '@/context/TableContext';
import dynamic from 'next/dynamic';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '@/hooks/useDebounce';
import { FixedSizeList as List } from 'react-window';
import Image from 'next/image';
import { removeFromCart } from '@/utils/cart';
import useMenuData, { CategoryWithItems } from '@/hooks/useMenuData';
import SearchButton from './SearchButton';
import { useCustomerAlias } from '@/hooks/useCustomerAlias';
import { validateTableCode as useTableCode } from '@/hooks/useTableCode';
import useCart from '@/hooks/useCart';
import { getCartQuantityForItem } from '@/utils/cart';
// import MenuItemProps from './MenuItem'

// Load heavy libraries dynamically
const ModifierModal = dynamic(() => import('./ModifierModal'), { ssr: false });
const CartModal = dynamic(() => import('./CartModal'), { ssr: false });
const AliasModal = dynamic(
  () => import('@/components/ui/AliasModal').then((mod) => mod.AliasModal),
  { ssr: false },
);
const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  { ssr: false },
);

interface Allergen {
  id: string;
  name: string;
  icon_url: string | null;
}

interface SlotCategory {
  slot_id: string;
  category_id: string;
}

interface MenuItemAllergen {
  id: string;
  name: string;
  icon_url: string;
}

interface DietTag {
  id: string;
  name: string;
}

interface MenuItemDietTag {
  diet_tags: DietTag;
}

interface ModifierOption {
  id: string;
  name: string;
  extra_price: number;
  is_default: boolean;
  icon_url: string | undefined;
  related_menu_item_id: string | undefined;
  allergens: {
    id: string;
    name: string;
    icon_url: string | undefined;
  }[];
}

interface Modifier {
  id: string;
  name: string;
  description: string;
  required: boolean;
  multi_select: boolean;
  options: {
    id: string;
    name: string;
    extra_price: number;
    is_default: boolean;
    icon_url: string | undefined;
    related_menu_item_id: string | undefined;
    allergens: {
      id: string;
      name: string;
      icon_url: string | undefined;
    }[];
  }[];
}

export interface SelectedItem {
  id: string;
  name: string;
  description: string;
  allergens: MenuItemAllergen[];
  modifiers: Modifier[];
}

interface CartItem {
  id: string;
  quantity: number;
  modifiers: Record<
    string,
    {
      name: string;
      options: {
        id: string;
        name: string;
        extra_price: number;
      }[];
    }
  >;
  item: MenuItemData;
  client_alias?: string;
}

export interface Cart {
  [key: string]: CartItem;
}

// Example usage of react-window for virtualization
interface VirtualizedMenuItemsProps {
  items: MenuItemData[];
}

function VirtualizedMenuItems({ items }: VirtualizedMenuItemsProps) {
  return (
    <List
      height={500} // Adjust height as needed
      itemCount={items.length}
      itemSize={100} // Adjust item size as needed
      width={'100%'}
    >
      {({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div style={style}>
          <MenuItem
            id={items[index].id}
            name={items[index].name}
            description={items[index].description}
            price={items[index].price}
            image_url={items[index].image_url}
            allergens={items[index].allergens.map((a) => ({ ...a, icon_url: a.icon_url || '' }))}
            diet_tags={[]}
            food_info={''}
            origin={''}
            pairing_suggestion={''}
            chef_notes={''}
            is_recommended={items[index].is_recommended}
            onAddToCart={() => {}}
            onRemoveFromCart={() => {}}
            quantity={0}
          />
        </div>
      )}
    </List>
  );
}

// Example usage of Next.js Image component for optimized images
interface OptimizedImageProps {
  src: string;
  alt: string;
}

function OptimizedImage({ src, alt }: OptimizedImageProps) {
  return <Image src={src} alt={alt} layout="responsive" width={500} height={500} loading="lazy" />;
}

// Agregar la función getCartKey
export const getCartKey = (itemId: string, modifiers: Record<string, any>) => {
  return `${itemId}-${JSON.stringify(modifiers)}`;
};

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
  const menuScrollRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MenuItemData[]>([]);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const { alias } = useCustomer();
  const { tableNumber } = useTable();
  const isScrollingProgrammatically = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef(Date.now());

  // Usar el contexto del carrito
  const {
    addToCart,
    removeFromCartByItem,
    getItemQuantity,
    cart: cartItems,
    cartTotal,
    getTotalItems,
  } = useCartContext();

  // Inicializar activeTab cuando cambien las categorías
  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].id);
    }
  }, [categories, activeTab]);

  const { modifiers, fetchModifiers } = useModifiers();

  // Función para determinar qué categoría es más visible
  const getMostVisibleCategory = useCallback(() => {
    if (!menuScrollRef.current) return null;

    const scrollTop = menuScrollRef.current.scrollTop;
    const viewportHeight = menuScrollRef.current.clientHeight;
    const headerHeight = 120;
    let maxVisibleRatio = 0;
    let mostVisibleCategory = null;

    categories.forEach((category: CategoryWithItems) => {
      const element = document.getElementById(`category-${category.id}`);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const elementHeight = rect.height;
      const elementTop = rect.top;
      const elementBottom = rect.bottom;

      // Calcular qué tanto del elemento es visible en el viewport
      const visibleTop = Math.max(headerHeight, elementTop);
      const visibleBottom = Math.min(viewportHeight, elementBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = visibleHeight / elementHeight;

      if (visibilityRatio > maxVisibleRatio) {
        maxVisibleRatio = visibilityRatio;
        mostVisibleCategory = category.id;
      }
    });

    return mostVisibleCategory;
  }, [categories]);

  // Efecto para manejar el scroll
  useEffect(() => {
    if (!menuScrollRef.current) return;

    const handleScroll = () => {
      // Si el scroll es programático, ignoramos la detección
      if (isScrollingProgrammatically.current) return;

      // Obtener la categoría más visible directamente en el evento de scroll
      const mostVisibleCategory = getMostVisibleCategory();
      if (mostVisibleCategory && mostVisibleCategory !== activeTab) {
        setActiveTab(mostVisibleCategory);
      }
    };

    // Throttling para evitar demasiadas actualizaciones
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandleScroll = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleScroll();
          throttleTimeout = null;
        }, 100); // Actualizar cada 100ms
      }
    };

    menuScrollRef.current.addEventListener('scroll', throttledHandleScroll);
    return () => {
      if (menuScrollRef.current) {
        menuScrollRef.current.removeEventListener('scroll', throttledHandleScroll);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [activeTab, getMostVisibleCategory]);

  // Función para manejar clic en categorías
  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      const element = document.getElementById(`category-${categoryId}`);
      if (!element || !menuScrollRef.current) return;

      isScrollingProgrammatically.current = true;
      setActiveTab(categoryId);

      const headerHeight = 120;
      const elementTop = element.getBoundingClientRect().top;
      const currentScroll = menuScrollRef.current.scrollTop;
      const targetScroll = currentScroll + elementTop - headerHeight;

      // Detectar si es un scroll largo hacia arriba
      const isLongUpwardScroll =
        targetScroll < currentScroll && Math.abs(targetScroll - currentScroll) > 1000;

      menuScrollRef.current.scrollTo({
        top: targetScroll,
        behavior: isLongUpwardScroll ? 'auto' : 'smooth', // Usamos 'auto' para scrolls largos hacia arriba
      });

      // Limpiamos cualquier timeout anterior
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Para scrolls largos hacia arriba, damos un poco más de tiempo
      scrollTimeout.current = setTimeout(
        () => {
          isScrollingProgrammatically.current = false;

          // Para scrolls largos hacia arriba, forzamos un recheck de la categoría
          if (isLongUpwardScroll) {
            const mostVisibleCategory = getMostVisibleCategory();
            if (mostVisibleCategory) {
              setActiveTab(mostVisibleCategory);
            }
          }
        },
        isLongUpwardScroll ? 100 : 800,
      );
    },
    [getMostVisibleCategory],
  );

  const handleItemClick = useCallback(
    async (itemId: string) => {
      const item = initialMenuItems.find((item) => item.id === itemId);
      if (!item) return;

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

      addToCart(itemId, {});
    },
    [initialMenuItems, fetchModifiers, addToCart],
  );

  const onModifierSubmit = useCallback(
    (options: Record<string, string[]>) => {
      if (selectedItem) {
        handleModifierSubmit(selectedItem, options, modifiers, addToCart, () => {
          setShowModifierModal(false);
          setSelectedItem(null);
        });
      }
    },
    [selectedItem, modifiers, addToCart],
  );

  const debouncedSearch = useDebounce((query: string) => {
    setFilteredItems(searchMenuItems(query, initialMenuItems));
  }, 200);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  useEffect(() => {
    resetSearch(setSearchQuery, setFilteredItems, setSearchActive);
  }, [currentSlot, activeTab]);

  // Bloquear scroll del body cuando el overlay está activo
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

  // Función para manejar la eliminación de items del carrito
  const handleRemoveItem = useCallback(
    (cartKey: string) => {
      const item = cartItems[cartKey];
      if (!item) return;

      removeFromCartByItem(item.id, item.modifiers);
    },
    [cartItems, removeFromCartByItem],
  );

  const handleAliasConfirm = async (newAlias: string) => {
    console.log('[MenuScreen] Guardando alias:', newAlias);
    // Limpiar cualquier timeout pendiente
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    // Cerrar el modal
    setShowAliasModal(false);
    return true; // Indicar que se guardó correctamente
  };

  if (loading && !activeTab) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error.message} />;
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
          menuScrollRef={menuScrollRef}
        />

        {categories.map((category: CategoryWithItems) => (
          <CategorySection
            key={category.id}
            category={category}
            cart={cartItems}
            onAddToCart={(item) => handleItemClick(item.id)}
            onRemoveFromCart={(item) => removeFromCartByItem(item.id, {})}
          />
        ))}
      </div>

      <FloatingCartButton
        onClick={() => setShowCartModal(true)}
        getTotalItems={getTotalItems}
        cartTotal={cartTotal}
      />

      <SearchButton onClick={() => setSearchActive(true)} />

      <SearchOverlay
        searchQuery={searchQuery}
        searchActive={searchActive}
        filteredItems={filteredItems}
        handleSearch={(q) => {
          setSearchQuery(q);
          setFilteredItems(searchMenuItems(q, initialMenuItems));
        }}
        onClose={() => resetSearch(setSearchQuery, setFilteredItems, setSearchActive)}
        onAddToCart={handleItemClick}
        onRemoveItem={handleRemoveItem}
        cart={cartItems}
        resetSearch={() => resetSearch(setSearchQuery, setFilteredItems, setSearchActive)}
      />

      {showModifierModal &&
        selectedItem &&
        modifiers.length > 0 &&
        ReactDOM.createPortal(
          <ModifierModal
            isOpen={showModifierModal}
            itemName={selectedItem.name}
            itemDescription={selectedItem.description}
            itemAllergens={selectedItem.allergens}
            modifiers={modifiers}
            menuItems={initialMenuItems}
            onClose={() => {
              console.log('Closing modifier modal');
              setShowModifierModal(false);
              setSelectedItem(null);
            }}
            onConfirm={(selectedOptions) => onModifierSubmit(selectedOptions)}
          />,
          document.body,
        )}

      {showCartModal && (
        <CartModal
          items={cartItems}
          menuItems={initialMenuItems}
          onClose={() => setShowCartModal(false)}
          onRemoveItem={handleRemoveItem}
          onAddToCart={addToCart}
          currentClientAlias={alias ?? undefined}
        />
      )}

      {showAliasModal && (
        <AliasModal
          isOpen={showAliasModal}
          onClose={() => {
            console.log('[MenuScreen] Cerrando modal de alias');
            setShowAliasModal(false);
          }}
          onConfirm={handleAliasConfirm}
        />
      )}
    </div>
  );
}
