'use client';

import React from 'react';
import { FixedSizeList as List } from 'react-window';
import MenuItem from '@/components/screens/MenuItem';
import { useCartContext } from '@/context/CartContext';
import type { MenuItemData } from '@/types/menu';

interface VirtualizedMenuItemsProps {
  items: MenuItemData[];
}

export default function VirtualizedMenuItems({ items }: VirtualizedMenuItemsProps) {
  // ① 👇 extraemos del contexto los helpers
  const { addToCart, removeFromCartByItem, getItemQuantity } = useCartContext();

  return (
    <List
      height={500}
      itemCount={items.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => {
        const item = items[index];
        const qty = getItemQuantity(item.id);

        return (
          <div style={style}>
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

              // ② 👇 mostramos la cantidad real
              quantity={qty}

              // ③ 👇 handlers efectivos que suman y restan
              onAddToCart={() => addToCart(item.id, {})}
              onRemoveFromCart={() => removeFromCartByItem(item.id, {})}
            />
          </div>
        );
      }}
    </List>
  );
} 