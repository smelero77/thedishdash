import React from 'react';
import { MenuItem } from '../types';
import { formatPrice } from '../utils/format.utils';
import { Clock, Star, AlertCircle } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  onViewDetails: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem) => void;
  isRecommended?: boolean;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  onViewDetails,
  onAddToCart,
  isRecommended = false
}) => {
  const {
    name,
    description,
    price,
    imageUrl,
    isAvailable,
    isVegetarianBase,
    isVeganBase,
    isGlutenFreeBase
  } = item;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Imagen */}
      <div className="relative h-48">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400">Sin imagen</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {isRecommended && (
            <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Star className="w-3 h-3" />
              Recomendado
            </div>
          )}
          {!isAvailable && (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              No disponible
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {name}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Diet Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {isVegetarianBase && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Vegetariano
            </span>
          )}
          {isVeganBase && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Vegano
            </span>
          )}
          {isGlutenFreeBase && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Sin Gluten
            </span>
          )}
        </div>

        {/* Precio y Acciones */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(price)}
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(item)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Ver detalles
            </button>
            
            {isAvailable && onAddToCart && (
              <button
                onClick={() => onAddToCart(item)}
                className="px-3 py-1.5 bg-[#1ce3cf] text-white text-sm font-medium rounded-lg hover:bg-[#11c9b7] transition-colors"
              >
                Añadir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 