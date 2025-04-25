import React from 'react';
import MenuItem from '../MenuItem';
import { Category, MenuItemData, Cart } from '@/types/menu';
import { getCartQuantityForItem, removeFromCart, getFirstCartKeyForItem } from '@/utils/cart';

interface CategorySectionProps {
  category: Category;
  menuItems: MenuItemData[];
  cart: Cart;
  onItemClick: (itemId: string) => void;
  onRemoveItem: (cartKey: string) => void;
}

const CategorySection = React.forwardRef<HTMLDivElement, CategorySectionProps>(
  ({ category, menuItems, cart, onItemClick, onRemoveItem }, ref) => {
    if (!category) {
      return null;
    }

    const filteredItems = menuItems?.filter(item => 
      item?.category_ids?.includes(category.id)
    ) || [];

    return (
      <div
        ref={ref}
        id={`category-${category.id}`}
        className="divide-y divide-gray-200/10"
      >
        <div className="py-6">
          {category.image_url && (
            <div className="relative w-full h-48">
              <img 
                src={category.image_url} 
                alt={category.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              <h2 className="absolute inset-0 flex items-center justify-center text-white/80 text-5xl font-bold text-center px-4">
                {category.name}
              </h2>
            </div>
          )}
        </div>
        <div className="px-4">
          {filteredItems.map((item) => {
            if (!item) return null;
            
            const quantity = getCartQuantityForItem(cart, item.id);
            const cartKey = getFirstCartKeyForItem(cart, item.id);
            
            return (
              <div key={item.id} className="py-6">
                <MenuItem
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image_url={item.image_url}
                  allergens={item.allergens}
                  diet_tags={item.diet_tags || []}
                  food_info={item.food_info || ''}
                  origin={item.origin || ''}
                  pairing_suggestion={item.pairing_suggestion || ''}
                  chef_notes={item.chef_notes || ''}
                  is_recommended={item.is_recommended}
                  onAddToCart={() => onItemClick(item.id)}
                  onRemoveFromCart={() => cartKey && onRemoveItem(cartKey)}
                  quantity={quantity}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CategorySection.displayName = 'CategorySection';

export default CategorySection; 