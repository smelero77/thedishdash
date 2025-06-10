import React, { useEffect, useRef, forwardRef } from 'react';
import { Category } from '@/types/menu';
import Image from 'next/image';

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
      <div className="sticky top-0 bg-white shadow-sm z-20 mt-4">
        <div ref={tabsContainerRef} className="relative overflow-x-auto no-scrollbar bg-white">
          <div className="relative min-w-max">
            <div className="absolute bottom-0 left-0 right-0 h-4 border-b-4 border-[#e6e6e6]" />

            <div className="flex px-4 gap-4 scroll-smooth">
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
                  className={`flex flex-col items-center justify-center px-6 py-1.5 cursor-pointer transition-all duration-300 border-b-4 relative ${
                    activeTab === category.id
                      ? 'text-[#0e1b19] font-bold border-[#1ce3cf]'
                      : 'text-[#4f968f] hover:text-[#0e1b19] border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative mb-1.5">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#e0f2f1]">
                        <span className="text-xl text-[#4f968f]">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm leading-normal tracking-[0.015em] whitespace-nowrap">
                    {category.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CategoryTabsComponent.displayName = 'CategoryTabs';
export default React.memo(CategoryTabsComponent);
