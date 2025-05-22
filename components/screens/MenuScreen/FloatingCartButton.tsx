import React from 'react';
import { Button } from '@/components/ui/Button';
import useCart from '@/hooks/useCart';
import { cn } from '@/utils/cn';
import { useMenuData } from '@/hooks/useMenuData';
import { useCustomer } from '@/context/CustomerContext';
import { useTable } from '@/context/TableContext';

interface FloatingCartButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  // Mantenemos la flexibilidad de pasar className y otros HTMLAttributes
}

const FloatingCartButton = React.forwardRef<HTMLButtonElement, FloatingCartButtonProps>(
  ({ className, ...props }, ref) => {
    const { menuItems } = useMenuData();
    const { alias } = useCustomer();
    const { tableNumber } = useTable();

    const { cartTotal, actions } = useCart(menuItems, alias, tableNumber);

    const totalItems = actions.getTotalItems();

    if (totalItems === 0) {
      return null; // El botón se oculta si el carrito está vacío
    }

    return (
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            ref={ref}
            {...props}
            className={cn(
              // Clases base para posicionamiento y apariencia
              'w-full flex items-center justify-center rounded-full shadow-lg',
              // Colores y estilos específicos
              'bg-[#1ce3cf] text-[#0e1b19] hover:bg-[#1ce3cf] hover:text-[#0e1b19]',
              // Dimensiones
              'h-12',
              // Texto
              'text-base font-bold leading-normal tracking-[0.015em]',
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
