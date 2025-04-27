"use client";

import React, { HTMLAttributes } from "react";
import { Plus, Minus } from "lucide-react";
import { MenuItemAllergen as Allergen } from "../../types/menu";
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
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  quantity: number;
  is_available: boolean;
}

export default function MenuItem({
  id,
  name,
  description,
  price,
  image_url,
  allergens,
  diet_tags,
  food_info,
  origin,
  pairing_suggestion,
  chef_notes,
  is_recommended,
  onAddToCart,
  onRemoveFromCart,
  quantity,
  is_available,
  ...rest
}: MenuItemProps) {
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",") + " €";
  };

  return (
    <div className="w-full px-4 py-2" {...rest}>
      {/* Image with badge */}
      <div className="relative w-full overflow-hidden aspect-[4/3] bg-cover bg-center rounded-lg">
        {image_url && (
          <Image
            src={image_url}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
            priority={false}
          />
        )}
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
            <div className="flex items-center gap-2">
              {allergens.map((a) => (
                <div
                  key={a.id}
                  className="w-5 h-5 bg-center bg-no-repeat bg-contain flex-shrink-0"
                  style={{ backgroundImage: a.icon_url ? `url(${a.icon_url})` : 'none' }}
                  title={a.name}
                >
                  {!a.icon_url && (
                    <div className="w-full h-full flex items-center justify-center bg-[#1ce3cf] rounded-full text-[8px] text-[#0e1b19] font-bold">
                      {a.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Price and buttons */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {quantity > 0 ? (
              <div className="flex items-center justify-between w-[8.5rem]">
                <button
                  onClick={onRemoveFromCart}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19]"
                  aria-label="Remove from cart"
                  type="button"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <p className="text-[#0e1b19] text-sm font-normal text-center">{formatPrice(price)}</p>
                <button
                  onClick={onAddToCart}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19]"
                  aria-label="Add to cart"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-[8.5rem]">
                <div className="w-8" />
                <p className="text-[#0e1b19] text-sm font-normal text-center">{formatPrice(price)}</p>
                <button
                  onClick={onAddToCart}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1ce3cf] text-[#0e1b19]"
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
        <p className="text-[#4f968f] text-sm font-normal leading-normal">{description}</p>
      </div>
    </div>
  );
}
