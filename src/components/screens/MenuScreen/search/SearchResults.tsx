import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import MenuItem from 'components/screens/MenuItem';
import { MenuItemData } from 'types/menu';

interface SearchResultsProps {
  items: MenuItemData[];
  isLoading: boolean;
  query: string;
  onClear: () => void;
  onItemClick: (item: MenuItemData) => void;
}

export const SearchResults = ({
  items,
  isLoading,
  query,
  onClear,
  onItemClick,
}: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <DotLottieReact
          src="https://lottie.host/2c5d3c5c-3c5c-3c5c-3c5c-3c5c3c5c3c5c/loading.json"
          autoplay
          loop
          className="w-16 h-16"
        />
      </div>
    );
  }

  if (!query.trim()) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No se encontraron resultados para "{query}"</p>
        <button onClick={onClear} className="text-primary mt-2">
          Limpiar búsqueda
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <MenuItem
          key={item.id}
          {...item}
          onClick={() => onItemClick(item)}
          onAddToCart={() => {}}
          onRemoveFromCart={() => {}}
          quantity={0}
        />
      ))}
    </div>
  );
};
