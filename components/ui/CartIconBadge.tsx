import React, { useContext } from 'react'; // Import useContext
import { ShoppingCart } from 'lucide-react';
import { CartActionsContext } from '@/context/CartActionsContext'; // <--- Importa el NUEVO contexto específico

export function CartIconBadge() {
  // Consume SOLO el contexto de acciones
  const cartActions = useContext(CartActionsContext);

  // Comprueba si el contexto está disponible (importante!)
  if (!cartActions) {
    // Puedes retornar null, 0, o un estado de carga mientras el provider se inicializa
    console.warn('CartActionsContext no disponible en CartIconBadge');
    // Retornar el icono sin número podría ser una opción
    return (
      <button className="relative" disabled>
        <ShoppingCart className="h-6 w-6 opacity-50" />
      </button>
    );
  }

  // Llama directamente a la función del contexto de acciones
  const totalItems = cartActions.getTotalItems();

  return (
    <button className="relative">
      <ShoppingCart className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {totalItems}
        </span>
      )}
    </button>
  );
}
