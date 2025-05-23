'use client';
import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { CartActionsContext } from '@/context/CartActionsContext';
import { CartTotalContext } from '@/context/CartTotalContext';

interface FloatingCartButtonProps extends React.HTMLAttributes<HTMLButtonElement> {}

const FloatingCartButton = React.forwardRef<HTMLButtonElement, FloatingCartButtonProps>(
  ({ className, ...props }, ref) => {
    const actions = useContext(CartActionsContext);
    const cartTotal = useContext(CartTotalContext);
    const [justUpdated, setJustUpdated] = useState(false);
    const totalItems = actions?.getTotalItems() ?? 0;

    // Dispara el anillo cuando cambia totalItems y hay al menos 1 artículo
    useEffect(() => {
      if (totalItems > 0) {
        setJustUpdated(true);
        const t = setTimeout(() => setJustUpdated(false), 1000);
        return () => clearTimeout(t);
      }
    }, [totalItems]);

    if (!actions || cartTotal === null || totalItems === 0) return null;

    return (
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            ref={ref}
            {...props}
            className={cn(
              'relative overflow-visible',
              'w-full h-12 rounded-full bg-[#1ce3cf] text-[#0e1b19]',
              'flex items-center justify-center shadow-lg',
              'text-base font-bold leading-normal tracking-[0.015em]',
              'hover:bg-[#1ce3cf] hover:text-[#0e1b19]',
              justUpdated && 'pulse-ring',
              className,
            )}
            aria-label={`Ver cesta, ${totalItems} artículos, total ${cartTotal.toFixed(2)}€`}
          >
            <span className="flex items-center justify-center gap-3">
              <span>Ver cesta</span>
              <span className="text-[#0e1b19] text-2xl font-extrabold">•</span>
              <span>{cartTotal.toFixed(2)}€</span>
            </span>
          </Button>
        </div>
      </div>
    );
  },
);

FloatingCartButton.displayName = 'FloatingCartButton';
export default FloatingCartButton;
