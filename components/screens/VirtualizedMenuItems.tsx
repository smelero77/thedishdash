'use client';

import React, { useContext, useCallback, forwardRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import MenuItem from '@/components/screens/MenuItem';
import { CartActionsContext } from '@/context/CartActionsContext';
import type { MenuItemData, SelectedModifiers } from '@/types/menu';

interface VirtualizedMenuItemsProps {
  items: MenuItemData[];
}

const VirtualizedMenuItemsComponent = forwardRef<HTMLDivElement, VirtualizedMenuItemsProps>(({
  items
}, ref) => {
  const cartActions = useContext(CartActionsContext);

  const handleAddItem = useCallback((itemId: string, modifiers: SelectedModifiers | null = null) => {
    if (!cartActions) return;
    cartActions.handleAddToCart(itemId, modifiers ?? {});
  }, [cartActions]);

  const handleRemoveItem = useCallback((itemId: string, modifiers: SelectedModifiers | null = null) => {
    if (!cartActions) return;
    cartActions.handleDecrementCart(itemId, modifiers ?? {});
  }, [cartActions]);

  return (
    <List
      height={500}
      itemCount={items.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => {
        const item = items[index];
        const qty = cartActions ? cartActions.getItemQuantity(item.id) : 0;

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
              is_available={item.is_available}
              quantity={qty}
              onAddToCart={() => handleAddItem(item.id)}
              onRemoveFromCart={() => handleRemoveItem(item.id)}
            />
          </div>
        );
      }}
    </List>
  );
});

VirtualizedMenuItemsComponent.displayName = "VirtualizedMenuItems";
export default React.memo(VirtualizedMenuItemsComponent); 