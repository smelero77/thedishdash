import React, { useEffect, useRef } from 'react';
import { Category } from '@/types/menu';

interface Props {
  categories: Category[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export default function CategoryTabs({ categories, activeTab, setActiveTab }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Mantener la pestaña activa centrada
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current.querySelector<HTMLDivElement>(`[data-id="${activeTab}"]`);
    if (el) {
      const { left, width } = el.getBoundingClientRect();
      const { left: cLeft, width: cWidth } = ref.current.getBoundingClientRect();
      const offset = left + width / 2 - (cLeft + cWidth / 2);
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <div
      ref={ref}
      className="
        flex
        overflow-x-auto
        whitespace-nowrap
        scrollbar-none
        bg-[#f8fbfb]
        shadow-sm
        px-4
        py-2
      "
    >
      {categories.map((cat) => (
        <div
          key={cat.id}
          data-id={cat.id}
          onClick={() => setActiveTab(cat.id)}
          className={`
            inline-flex
            flex-shrink-0
            items-center
            justify-center
            px-5
            py-2
            cursor-pointer
            transition
            ${
              activeTab === cat.id
                ? 'font-bold text-[#0e1b19] border-b-2 border-[#1ce3cf]'
                : 'text-[#4f968f] hover:text-[#0e1b19]'
            }
          `}
        >
          {cat.name}
        </div>
      ))}
    </div>
  );
}
