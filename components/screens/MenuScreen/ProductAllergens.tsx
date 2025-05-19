import React from 'react';
import { MenuItemAllergen } from '@/types/modifiers';

interface ProductAllergensProps {
  allergens: MenuItemAllergen[];
}

const ProductAllergens: React.FC<ProductAllergensProps> = ({ allergens }) => {
  if (!allergens || allergens.length === 0) return null;
  return (
    <div className="px-4 pb-2">
      <h3 className="text-sm font-semibold text-[#0e1b19] mb-1">Alérgenos</h3>
      <div className="flex items-center gap-2 flex-wrap">
        {allergens.map((a) => (
          <div
            key={a.id}
            className="w-6 h-6 bg-center bg-no-repeat bg-contain flex-shrink-0"
            style={{ backgroundImage: a.icon_url ? `url(${a.icon_url})` : 'none' }}
            title={a.name}
          >
            {!a.icon_url && (
              <div className="w-full h-full flex items-center justify-center bg-[#1ce3cf] rounded-full text-[10px] text-[#0e1b19] font-bold">
                {a.name ? a.name.substring(0, 2).toUpperCase() : '?'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductAllergens; 