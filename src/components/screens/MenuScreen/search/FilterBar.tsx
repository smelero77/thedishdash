import React from 'react';

interface FilterBarProps {
  onFilterClick: (filterName: string) => void;
  isAnyFilterActive: boolean;
  onResetFilters: () => void;
}

export const FilterBar = ({ onFilterClick, isAnyFilterActive, onResetFilters }: FilterBarProps) => {
  return (
    <div className="px-4 pb-2 flex items-center gap-2 border-b border-gray-200 flex-wrap">
      <button
        onClick={() => onFilterClick('categories')}
        className="px-4 py-2 text-sm border rounded-full hover:bg-gray-100 transition-colors"
      >
        Categorías
      </button>
      <button
        onClick={() => onFilterClick('price')}
        className="px-4 py-2 text-sm border rounded-full hover:bg-gray-100 transition-colors"
      >
        Precio
      </button>

      {isAnyFilterActive && (
        <button
          onClick={onResetFilters}
          className="ml-auto text-sm text-red-500 font-semibold hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
};
