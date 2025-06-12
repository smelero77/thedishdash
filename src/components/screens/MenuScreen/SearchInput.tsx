import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  onClear: () => void;
}

export const SearchInput = ({ query, onQueryChange, onClear }: SearchInputProps) => (
  <div className="relative">
    <input
      type="search"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder="Buscar en la carta..."
      className="w-full pl-12 pr-10 py-3 text-lg rounded-full border border-[#d0e6e4] focus:outline-none focus:ring-2 focus:ring-[#1ce3cf]"
    />
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4f968f]" />
    {query && (
      <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-2">
        <X className="h-5 w-5 text-gray-500" />
      </button>
    )}
  </div>
);
