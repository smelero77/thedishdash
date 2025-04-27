import { forwardRef } from 'react';
import { Category, MenuItemData } from '../../types/menu';
import { Cart } from '../../types/cart';
import MenuItem from '../MenuItem';
import Image from 'next/image';
import { useCartContext } from '@/context/CartContext';

interface CategorySectionProps {
  category: Category & {
    description?: string;
    items: MenuItemData[];
    image_url: string;
  };
  onAddToCart: (item: MenuItemData) => void;
  onRemoveFromCart: (item: MenuItemData) => void;
  cart: Cart;
}

export const CategorySection = forwardRef<HTMLDivElement, CategorySectionProps>(
  ({ category, onAddToCart, onRemoveFromCart, cart }, ref) => {
    const { getItemQuantity } = useCartContext();

    return (
      <div ref={ref} id={`category-${category.id}`} className="mb-12">
        {/* Banner full-width */}
        <div className="relative w-full h-64 overflow-hidden">
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <h2 className="text-white text-4xl font-bold text-center">
              {category.name}
            </h2>
          </div>
        </div>

        {/* Contenido de la sección */}
        <div className="px-4">
          {category.description && (
            <p className="mb-4 text-gray-500">
              {category.description}
            </p>
          )}

          <div className="divide-y divide-gray-200/20">
            {category.items.map((item) => {
              const qty = getItemQuantity(item.id);
              return (
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
                    quantity={qty}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

CategorySection.displayName = 'CategorySection';
export default CategorySection;
