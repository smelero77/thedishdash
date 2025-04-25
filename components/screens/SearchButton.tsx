import React from 'react';
import { Search } from 'lucide-react';

interface SearchButtonProps {
  onClick: () => void;
}

export default function SearchButton({ onClick }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute top-6 left-4 z-20 bg-white rounded-full p-3 shadow-md hover:shadow-lg transition-shadow"
      aria-label="Buscar en el menú"
    >
      <Search className="h-5 w-5 text-[#4f968f]" />
    </button>
  );
} 