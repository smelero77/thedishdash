import React, { useContext, forwardRef } from 'react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/utils/format';

interface FloatingCartButtonProps {
  onClick: () => void;
  getTotalItems: () => number;
  cartTotal?: number;
  className?: string;
}

const FloatingCartButtonComponent = forwardRef<HTMLButtonElement, FloatingCartButtonProps>(
  ({ onClick, getTotalItems, cartTotal = 0, className }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation(); // Prevenir la propagación del evento
      onClick();
    };

    return (
      <Button
        onClick={handleClick}
        className={`w-full h-14 bg-[#1ce3cf] text-[#0e1b19] text-base font-bold leading-normal tracking-[0.015em] rounded-full shadow-lg hover:bg-[#1ce3cf] hover:text-[#0e1b19] ${className || ''}`}
        ref={ref}
      >
        <span className="flex items-center justify-center gap-3">
          <span>Ver cesta</span>
          <span className="text-[#0e1b19] text-2xl font-extrabold">•</span>
          <span>{formatPrice(cartTotal)}</span>
        </span>
      </Button>
    );
  },
);

FloatingCartButtonComponent.displayName = 'FloatingCartButton';
export default React.memo(FloatingCartButtonComponent);
