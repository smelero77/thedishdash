import React from 'react';

interface ProductActionsProps {
  onAddToCart: () => void;
  hasModifiers?: boolean;
}

const ProductActions: React.FC<ProductActionsProps> = ({ onAddToCart, hasModifiers }) => (
  <div className="px-4 py-4 flex gap-4">
    <button
      className="flex-1 py-3 bg-[#1ce3cf] text-white font-bold rounded-xl text-lg shadow-md hover:bg-[#19cfc0] transition"
      onClick={onAddToCart}
    >
      Añadir al carrito
    </button>
    {hasModifiers && (
      <button className="flex-1 py-3 bg-[#f8fbfb] text-[#1ce3cf] font-bold rounded-xl text-lg shadow-md border border-[#1ce3cf] hover:bg-[#e0f7f4] transition">
        Personalizar
      </button>
    )}
  </div>
);

export default ProductActions; 