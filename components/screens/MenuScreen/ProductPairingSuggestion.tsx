import React from 'react';

interface ProductPairingSuggestionProps {
  suggestion?: string;
}

const ProductPairingSuggestion: React.FC<ProductPairingSuggestionProps> = ({ suggestion }) => {
  if (!suggestion) return null;
  return (
    <div className="px-4 pb-2">
      <h3 className="text-sm font-bold text-[#0e1b19] mb-2">Sugerencia de maridaje</h3>
      <p className="text-sm text-[#0e1b19]">{suggestion}</p>
    </div>
  );
};

export default ProductPairingSuggestion;
