import React, { useEffect, useRef, forwardRef } from 'react';
import { Category } from '@/types/menu';

interface CategoryTabsProps {
  categories: Category[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  menuScrollRef: React.RefObject<HTMLDivElement>;
}

const CategoryTabsComponent = forwardRef<HTMLDivElement, CategoryTabsProps>(
  ({ categories, activeTab, setActiveTab, menuScrollRef }, ref) => {
    const tabsContainerRef = useRef<HTMLDivElement>(null);

    // Efecto para mantener la pestaña activa visible en la barra de las categorías
    useEffect(() => {
      if (!tabsContainerRef.current) return;

      const activeTabElement = tabsContainerRef.current.querySelector(
        `[data-category-id="${activeTab}"]`,
      );
      if (activeTabElement) {
        const container = tabsContainerRef.current;
        const tabRect = activeTabElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const centerPosition =
          tabRect.left + tabRect.width / 2 - containerRect.left - containerRect.width / 2;

        container.scrollTo({
          left: container.scrollLeft + centerPosition,
          behavior: 'smooth',
        });
      }
    }, [activeTab]);

    return (
      <div className="w-full h-full bg-[#f8fbfb] shadow-sm">
        <div
          ref={tabsContainerRef}
          className="w-full h-full flex overflow-x-auto scrollbar-none"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            overscrollBehaviorX: 'contain',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'pan-x',
            willChange: 'transform',
          }}
        >
          <div className="flex h-full items-center px-4 space-x-4">
            {categories.map((category) => (
              <div
                key={category.id}
                data-category-id={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex-shrink-0 flex items-center justify-center px-5 py-3 cursor-pointer transition-all duration-300 relative touch-none max-w-none ${
                  activeTab === category.id
                    ? 'text-[#0e1b19] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[#1ce3cf] after:z-10'
                    : 'text-[#4f968f] hover:text-[#0e1b19]'
                }`}
              >
                <p className="text-base leading-normal tracking-[0.015em] whitespace-nowrap">
                  {category.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

CategoryTabsComponent.displayName = 'CategoryTabs';
export default React.memo(CategoryTabsComponent);
