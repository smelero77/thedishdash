import React from 'react';

interface ProductNutritionProps {
  nutrition?: { [key: string]: string | number };
}

const ProductNutrition: React.FC<ProductNutritionProps> = ({ nutrition }) => {
  if (!nutrition || Object.keys(nutrition).length === 0) return null;
  return (
    <div className="px-4 pb-2">
      <h3 className="text-sm font-semibold text-[#0e1b19] mb-1">Información nutricional</h3>
      <ul className="list-disc list-inside text-sm text-[#0e1b19]">
        {Object.entries(nutrition).map(([key, value]) => (
          <li key={key}><span className="font-medium">{key}:</span> {value}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProductNutrition; 