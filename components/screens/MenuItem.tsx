// thedishdash/components/screens/MenuItem.tsx
"use client";

import React, { HTMLAttributes } from "react"; // Importación explícita de React
import { Plus, Minus } from "lucide-react";
import { MenuItemAllergen as Allergen } from "../../types/menu"; // Asegúrate que la ruta sea correcta
import Image from "next/image";

interface MenuItemProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  allergens: Allergen[];
  diet_tags: string[];
  food_info: string;
  origin: string;
  pairing_suggestion: string;
  chef_notes: string;
  is_recommended: boolean;
  onAddToCart: () => void; // Función para añadir/incrementar el ítem
  onRemoveFromCart: () => void; // Función para decrementar/eliminar el ítem
  quantity: number; // Cantidad actual del ítem en el carrito
  is_available: boolean;
}

// Definición del componente funcional MenuItem (sin export default aquí)
function MenuItem({
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
  ...rest
}: MenuItemProps) {

  const formatPrice = (price: number) => {
    // Considerar usar Intl.NumberFormat para un formateo más robusto y localizado
    // const formatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
    // return formatter.format(price);
    return price.toFixed(2).replace(".", ",") + " €";
  };

  // Podrías añadir lógica para deshabilitar botones si !is_available

  return (
    <div className="w-full px-4 py-2" {...rest}>
      {/* Image with badge */}
      <div className="relative w-full overflow-hidden aspect-[4/3] bg-gray-200 bg-cover bg-center rounded-lg"> {/* Añadido bg-gray-200 para fallback */}
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
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <p className="text-[#0e1b19] text-lg font-bold leading-tight tracking-[-0.015em] truncate">{name}</p>
            <div className="flex items-center gap-2 flex-wrap"> {/* Añadido flex-wrap por si hay muchos alérgenos */}
              {/* Renderiza los iconos de alérgenos */}
              {allergens?.map((a) => ( // Añadido optional chaining por si allergens es undefined
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
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {quantity > 0 ? (
              // Si hay cantidad en el carrito, mostrar botones +/-
              <div className="flex items-center justify-between w-[8.5rem]">
                <button
                  onClick={onRemoveFromCart}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19] transition-opacity hover:opacity-80"
                  aria-label="Remove one from cart"
                  type="button"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <p className="text-[#0e1b19] text-sm font-normal text-center min-w-[4ch]"> {/* Ancho mínimo para el precio */}
                  {formatPrice(price)}
                </p>
                <button
                  onClick={onAddToCart}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19] transition-opacity hover:opacity-80"
                  aria-label="Add one more to cart"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Si no hay cantidad, mostrar solo el botón +
              <div className="flex items-center justify-between w-[8.5rem]">
                <div className="w-8" /> {/* Espaciador para alinear */}
                 <p className="text-[#0e1b19] text-sm font-normal text-center min-w-[4ch]"> {/* Ancho mínimo para el precio */}
                  {formatPrice(price)}
                </p>
                <button
                  onClick={onAddToCart}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19] transition-opacity hover:opacity-80"
                  aria-label="Add to cart"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
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
}

// Exportar la versión memoizada del componente
export default React.memo(MenuItem);