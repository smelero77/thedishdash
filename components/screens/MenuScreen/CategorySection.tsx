"use client";

import { forwardRef } from 'react';
import { Category, MenuItemData } from '@/types/menu';
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
  onRemoveFromCart: (itemId: string) => void;
}

const CategorySectionComponent = forwardRef<HTMLDivElement, CategorySectionProps>(({
  category,
  itemQuantities,
  onAddToCart,
  onRemoveFromCart
}, ref) => {
  return (
    <div ref={ref} id={`category-${category.id}`} className="divide-y divide-gray-200/10 px-4">
      <div className="py-6">
        <h2 className="text-2xl font-bold text-white">{category.name}</h2>
        {category.description && (
          <p className="mt-2 text-gray-400">{category.description}</p>
        )}
      </div>
      {category.items.map((item) => (
        <div key={item.id} className="py-6">
          <MenuItem
            id={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            image_url={item.image_url}
            allergens={item.allergens}
            diet_tags={item.diet_tags}
            food_info={item.food_info}
            origin={item.origin}
            pairing_suggestion={item.pairing_suggestion}
            chef_notes={item.chef_notes}
            is_recommended={item.is_recommended}
            is_available={item.is_available}
            quantity={itemQuantities[item.id] || 0}
            onAddToCart={() => onAddToCart(item.id)}
            onRemoveFromCart={() => onRemoveFromCart(item.id)}
          />
        </div>
      ))}
    </div>
  );
});

CategorySectionComponent.displayName = "CategorySection";
export default React.memo(CategorySectionComponent);
