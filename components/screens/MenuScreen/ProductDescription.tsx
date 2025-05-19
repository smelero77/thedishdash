import React from 'react';

interface ProductDescriptionProps {
  description: string;
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ description }) => (
  <div className="px-4 pb-2">
    <p className="text-[#4f968f] text-base leading-normal">{description}</p>
  </div>
);

export default ProductDescription;
