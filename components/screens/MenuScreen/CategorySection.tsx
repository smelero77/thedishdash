"use client";

import { forwardRef, useMemo } from 'react';
import { Category, MenuItemData } from '@/types/menu';
import type { SelectedModifiers } from '@/types/modifiers';
import MenuItem from '@/components/screens/MenuItem';
import Image from "next/image";
import React from 'react';

interface CategorySectionProps {
  category: Category & {
    description?: string;
    items: MenuItemData[];
  };
  itemQuantities: Record<string, number>;
  onAddToCart: (itemId: string) => void;
  onRemoveFromCart: (itemId: string, modifiers?: SelectedModifiers | null) => void;
  onOpenCart: () => void;
}

const CategorySectionComponent = forwardRef<HTMLDivElement, CategorySectionProps>(({
  category,
  itemQuantities,
  onAddToCart,
  onRemoveFromCart,
  onOpenCart
}, ref) => {
  // Calcular la cantidad total para cada item
  const getItemQuantity = (itemId: string) => {
    return Object.entries(itemQuantities).reduce((total, [key, quantity]) => {
      if (key.startsWith(itemId)) {
        return total + quantity;
      }
      return total;
    }, 0);
  };

  return (
    <div ref={ref} id={`category-${category.id}`} className="divide-y divide-gray-200/10">
      {category.image_url && (
        <div className="relative w-full h-64">
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h2 className="text-7xl md:text-7xl font-bold text-white/90">{category.name}</h2>
          </div>
        </div>
      )}
      {!category.image_url && (
        <div className="px-4 py-6">
          <h2 className="text-2xl font-bold text-white">{category.name}</h2>
          {category.description && (
            <p className="mt-2 text-gray-400">{category.description}</p>
          )}
        </div>
      )}
      {category.items.map((item) => (
        <div key={item.id} className="px-4 py-6">
          <MenuItem
            id={item.id}
            name={item.name ?? ''}
            description={item.description ?? ''}
            price={item.price}
            image_url={item.image_url ?? ''}
            allergens={item.allergens ?? []}
            diet_tags={item.diet_tags ?? []}
            food_info={item.food_info ?? ''}
            origin={item.origin ?? ''}
            pairing_suggestion={item.pairing_suggestion ?? ''}
            chef_notes={item.chef_notes ?? ''}
            is_recommended={item.is_recommended ?? false}
            is_available={item.is_available ?? true}
            quantity={getItemQuantity(item.id)}
            onAddToCart={() => onAddToCart(item.id)}
            onRemoveFromCart={() => onRemoveFromCart(item.id)}
            hasModifiers={item.modifiers?.length > 0}
            onOpenCart={onOpenCart}
          />
        </div>
      ))}
    </div>
  );
});

CategorySectionComponent.displayName = "CategorySection";
export default React.memo(CategorySectionComponent);
