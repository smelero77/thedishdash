import React, { useRef } from 'react';
import { Category } from '@/types/menu';

interface Props {
  categories: Category[];
  activeTab: string;
  onTabClick: (id: string) => void;
  className?: string;
}

export default function CategoryTabs({ categories, activeTab, onTabClick, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={`category-tabs-inner flex overflow-x-auto whitespace-nowrap ${className || ''}`}
    >
      {categories.map((cat) => (
        <a
          key={cat.id}
          href={`#category-${cat.id}`}
          data-id={cat.id}
          onClick={(e) => {
            e.preventDefault();
            onTabClick(cat.id);
            const target = document.getElementById(`category-${cat.id}`);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className={`
            inline-flex flex-shrink-0 items-center justify-center
            px-5 py-2 cursor-pointer transition-colors duration-200
            ${
              activeTab === cat.id
                ? 'font-bold text-[#0e1b19] border-b-2 border-[#1ce3cf]'
                : 'text-[#4f968f] hover:text-[#0e1b19]'
            }
          `}
        >
          {cat.name}
        </a>
      ))}
    </div>
  );
}
