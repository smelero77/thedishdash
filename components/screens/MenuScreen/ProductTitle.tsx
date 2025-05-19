import React from 'react';

interface ProductTitleProps {
  name: string;
  price: number;
}

const ProductTitle: React.FC<ProductTitleProps> = ({ name, price }) => (
  <div className="flex items-center justify-between px-4 pt-4 pb-2">
    <h2 className="text-2xl font-bold text-[#0e1b19]">{name}</h2>
    <span className="text-xl font-semibold text-[#1ce3cf]">{price.toFixed(2)} €</span>
  </div>
);

export default ProductTitle; 