import React from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/utils/format';

interface ProductQuantityControlsProps {
  quantity: number;
  price: number;
  hasModifiers?: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onOpenCart?: () => void;
}

const ProductQuantityControls: React.FC<ProductQuantityControlsProps> = ({
  quantity,
  price,
  hasModifiers = false,
  onAdd,
  onRemove,
  onOpenCart
}) => {
  return (
    <div className="flex items-center justify-between w-[8.5rem]">
      {quantity > 0 ? (
        <>
          {hasModifiers ? (
            <button
              onClick={onOpenCart}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19] transition-opacity hover:opacity-80"
              aria-label="Open cart"
              type="button"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onRemove}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19] transition-opacity hover:opacity-80"
              aria-label="Remove one from cart"
              type="button"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}
          <p className="text-[#0e1b19] text-sm font-normal text-center min-w-[4ch]">
            {formatPrice(price)}
          </p>
          <button
            onClick={onAdd}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19] transition-opacity hover:opacity-80"
            aria-label="Add one more to cart"
            type="button"
          >
            <Plus className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <div className="w-8" />
          <p className="text-[#0e1b19] text-sm font-normal text-center min-w-[4ch]">
            {formatPrice(price)}
          </p>
          <button
            onClick={onAdd}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19] transition-opacity hover:opacity-80"
            aria-label="Add to cart"
            type="button"
          >
            <Plus className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

export default ProductQuantityControls; 