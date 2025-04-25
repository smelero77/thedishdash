import { forwardRef } from 'react';
import { Category, MenuItemData } from '../types/menu';
import { Cart } from '../types/cart';
import MenuItem from './MenuItem';
import Image from "next/image";

interface CategorySectionProps {
  category: Category & {
    description?: string;
    items: MenuItemData[];
  };
  onAddToCart: (item: MenuItemData) => void;
  onRemoveFromCart: (item: MenuItemData) => void;
  cart: Cart;
}

export const CategorySection = forwardRef<HTMLDivElement, CategorySectionProps>(
  ({ category, onAddToCart, onRemoveFromCart, cart }, ref) => {
    return (
      <div ref={ref} id={category.id} className="divide-y divide-gray-200/10 px-4">
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
              onAddToCart={() => onAddToCart(item)}
              onRemoveFromCart={() => onRemoveFromCart(item)}
              quantity={cart[item.id]?.quantity || 0}
            />
          </div>
        ))}
      </div>
    );
  }
);

CategorySection.displayName = "CategorySection";

export default CategorySection; 