import React from 'react';
import { POPULAR_SEARCHES } from '@/utils/searchConfig';

interface SearchSuggestionsProps {
  history: string[];
  onSearch: (searchTerm: string) => void;
}

export const SearchSuggestions = ({ history, onSearch }: SearchSuggestionsProps) => (
  <div className="text-center py-8 px-4">
    {history.length > 0 && (
      <div className="mb-8">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Búsquedas Recientes</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {history.map((term) => (
            <button
              key={term}
              onClick={() => onSearch(term)}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    )}
    <div>
      <h3 className="text-md font-semibold text-gray-700 mb-3">Sugerencias</h3>
      <div className="flex flex-wrap justify-center gap-2">
        {POPULAR_SEARCHES.map(({ term, icon }) => (
          <button
            key={term}
            onClick={() => onSearch(term)}
            className="px-3 py-1.5 bg-[#e0f2f1] text-[#00796b] rounded-full text-sm flex items-center gap-2 font-medium hover:bg-[#cce8e6]"
          >
            <span>{icon}</span>
            <span>{term}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
