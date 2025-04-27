import React, { useEffect, useRef } from 'react';

interface Category {
  id: string;
  name: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  menuScrollRef: React.RefObject<HTMLDivElement>;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeTab,
  setActiveTab,
  menuScrollRef
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Efecto para mantener la pestaña activa visible en la barra de categorías
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    
    const activeTabElement = tabsContainerRef.current.querySelector(`[data-category-id="${activeTab}"]`);
    if (activeTabElement) {
      const container = tabsContainerRef.current;
      const tabRect = activeTabElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const centerPosition = tabRect.left + (tabRect.width / 2) - containerRect.left - (containerRect.width / 2);
      
      container.scrollTo({
        left: container.scrollLeft + centerPosition,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  return (
    <div className="sticky top-0 bg-[#f8fbfb] shadow-sm z-20">
      <div 
        ref={tabsContainerRef}
        className="flex overflow-x-auto no-scrollbar border-b border-[#d0e6e4] px-4 gap-6 relative scroll-smooth"
      >
        {categories.map((category) => (
          <div
            key={category.id}
            data-category-id={category.id}
            onClick={() => setActiveTab(category.id)}
            className={`flex items-center justify-center px-4 py-2 cursor-pointer transition-all duration-300 ${
              activeTab === category.id
                ? 'text-[#0e1b19] font-bold border-b-4 border-[#1ce3cf]'
                : 'text-[#4f968f] hover:text-[#0e1b19]'
            }`}
          >
            <p className="text-sm leading-normal tracking-[0.015em] px-1">{category.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

CategoryTabs.displayName = "CategoryTabs";

export default CategoryTabs; 