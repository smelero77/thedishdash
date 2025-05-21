import React from 'react';
import { Search } from 'lucide-react';

interface SearchButtonProps {
  onClick: () => void;
}

const SearchButtonComponent = ({ onClick }: SearchButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-full p-3 shadow-md hover:shadow-lg transition-shadow"
      aria-label="Buscar en el menú"
    >
      <Search className="h-6 w-6 text-[#4f968f]" />
    </button>
  );
};

SearchButtonComponent.displayName = 'SearchButton';

export default React.memo(SearchButtonComponent);
