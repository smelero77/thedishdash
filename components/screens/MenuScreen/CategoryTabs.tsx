import React, { useEffect, useRef, forwardRef } from 'react';
import { Category } from '@/types/menu';

interface CategoryTabsProps {
  categories: Category[];
  activeTab: string;
  onTabClick: (id: string) => void;
  className?: string;
}

const CategoryTabsComponent = forwardRef<HTMLDivElement, CategoryTabsProps>(
  ({ categories, activeTab, onTabClick, className }, ref) => {
    const tabsContainerRef = useRef<HTMLDivElement>(null);

    // Efecto para mantener la pestaña activa visible en la barra de categorías
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
      <div className="sticky top-0 bg-white shadow-sm z-20">
        <div
          ref={tabsContainerRef}
          className="flex overflow-x-auto no-scrollbar border-b border-[#d0e6e4] px-4 gap-4 relative scroll-smooth bg-white"
        >
          {categories.map((category) => (
            <div
              key={category.id}
              data-category-id={category.id}
              onClick={() => {
                onTabClick(category.id);
                const target = document.getElementById(`category-${category.id}`);
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`flex items-center justify-center px-6 py-2 cursor-pointer transition-all duration-300 border-b-4 ${
                activeTab === category.id
                  ? 'text-[#0e1b19] font-bold border-[#1ce3cf]'
                  : 'text-[#4f968f] hover:text-[#0e1b19] border-transparent'
              }`}
            >
              <p className="text-sm leading-normal tracking-[0.015em] whitespace-nowrap">
                {category.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

CategoryTabsComponent.displayName = 'CategoryTabs';
export default React.memo(CategoryTabsComponent);
