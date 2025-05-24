import React from 'react';

interface ProductOriginProps {
  origin?: string;
}

const ProductOrigin: React.FC<ProductOriginProps> = ({ origin }) => {
  if (!origin) return null;
  return (
    <div className="px-4 pb-2">
      <h3 className="text-sm font-bold text-[#0e1b19] mb-2">Origen</h3>
      <p className="text-sm text-[#0e1b19]">{origin}</p>
    </div>
  );
};

export default ProductOrigin;
