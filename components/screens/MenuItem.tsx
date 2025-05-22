// thedishdash/components/screens/MenuItem.tsx
'use client';

import React, { HTMLAttributes, forwardRef } from 'react'; // Importación explícita de React
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { MenuItemAllergen as Allergen } from '@/types/modifiers';
import Image from 'next/image';
import { formatPrice } from '@/utils/format';
import ProductQuantityControls from './MenuScreen/ProductQuantityControls';

interface MenuItemProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  allergens: Allergen[];
  diet_tags: string[];
  food_info: string | null;
  origin: string | null;
  pairing_suggestion: string | null;
  chef_notes: string | null;
  is_recommended: boolean;
  onAddToCart: (e: React.MouseEvent) => void;
  onRemoveFromCart: (e: React.MouseEvent) => void;
  quantity: number;
  is_available: boolean;
  hasModifiers?: boolean;
  onOpenCart?: (e: React.MouseEvent) => void;
}

const MenuItemComponent = forwardRef<HTMLDivElement, MenuItemProps>(
  (
    {
      id,
      name,
      description,
      price,
      image_url,
      allergens,
      diet_tags, // Nota: Estas props no se usan actualmente en el JSX renderizado
      food_info, // ""
      origin, // ""
      pairing_suggestion, // ""
      chef_notes, // ""
      is_recommended, // ""
      onAddToCart,
      onRemoveFromCart,
      quantity,
      is_available, // Mantenemos la prop pero no la usamos en el JSX
      hasModifiers = false, // Valor por defecto
      onOpenCart,
      ...rest
    },
    ref,
  ) => {
    // Podrías añadir lógica para deshabilitar botones si !is_available

    return (
      <div className="w-full px-4 py-2" {...rest} ref={ref}>
        {/* Image with badge */}
        <div className="relative w-full overflow-hidden aspect-[4/3] bg-gray-200 bg-cover bg-center rounded-lg">
          {' '}
          {/* Añadido bg-gray-200 para fallback */}
          {image_url ? (
            <Image
              src={image_url}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              loading="lazy" // 'lazy' es bueno para imágenes que no están en la primera carga
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {/* Placeholder o icono si no hay imagen */}
              <span>?</span>
            </div>
          )}
          {/* Indicador de cantidad en el carrito */}
          {quantity > 0 && (
            <div className="absolute top-0 right-0 bg-[#1ce3cf] text-[#0e1b19] text-sm px-2 py-1 rounded-bl-lg font-semibold z-10">
              {quantity}x
            </div>
          )}
        </div>

        {/* Content container */}
        <div className="space-y-2 mt-3">
          {/* Name, allergens, and buttons row */}
          <div className="flex items-center justify-between gap-4">
            {/* Name and allergens */}
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-[#0e1b19] text-lg font-bold leading-tight tracking-[-0.015em] break-words whitespace-normal w-full overflow-hidden">
                {name}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {allergens?.map((a) => (
                  <div
                    key={a.id}
                    className="w-5 h-5 bg-center bg-no-repeat bg-contain flex-shrink-0"
                    style={{ backgroundImage: a.icon_url ? `url(${a.icon_url})` : 'none' }}
                    title={a.name}
                  >
                    {/* Fallback si no hay URL de icono */}
                    {!a.icon_url && (
                      <div className="w-full h-full flex items-center justify-center bg-[#1ce3cf] rounded-full text-[8px] text-[#0e1b19] font-bold">
                        {a.name ? a.name.substring(0, 2).toUpperCase() : '?'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Price and buttons */}
            <ProductQuantityControls
              quantity={quantity}
              price={price}
              hasModifiers={hasModifiers}
              onAdd={(e) => onAddToCart(e)}
              onRemove={(e) => onRemoveFromCart(e)}
              onOpenCart={onOpenCart}
            />
          </div>

          {/* Description */}
          {description && ( // Mostrar solo si hay descripción
            <p className="text-[#4f968f] text-sm font-normal leading-normal">{description}</p>
          )}

          {/* Puedes descomentar y usar las otras props si las necesitas */}
          {/* {food_info && <p className="text-xs text-gray-600">{food_info}</p>} */}
          {/* ... etc ... */}
        </div>
      </div>
    );
  },
);

MenuItemComponent.displayName = 'MenuItem';
export default React.memo(MenuItemComponent);
