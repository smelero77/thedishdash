import React from 'react';

interface ProductTitleProps {
  name: string;
}

const ProductTitle: React.FC<ProductTitleProps> = ({ name }) => {
  return (
    <h2 className="text-2xl font-bold text-[#0e1b19]">{name}</h2>
  );
};

export default ProductTitle; 