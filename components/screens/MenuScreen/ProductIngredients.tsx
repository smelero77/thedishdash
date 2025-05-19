import React from 'react';

interface ProductIngredientsProps {
  ingredients?: string[];
}

const ProductIngredients: React.FC<ProductIngredientsProps> = ({ ingredients }) => {
  if (!ingredients || ingredients.length === 0) return null;
  return (
    <div className="px-4 pb-2">
      <h3 className="text-sm font-semibold text-[#0e1b19] mb-1">Ingredientes</h3>
      <ul className="list-disc list-inside text-sm text-[#0e1b19]">
        {ingredients.map((ing, i) => (
          <li key={i}>{ing}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProductIngredients;
