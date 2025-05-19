import React from 'react';

interface ProductDietTagsProps {
  tags?: string[];
}

const ProductDietTags: React.FC<ProductDietTagsProps> = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="px-4 pb-2">
      <h3 className="text-sm font-semibold text-[#0e1b19] mb-1">Etiquetas</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="bg-[#e0f7f4] text-[#1ce3cf] px-2 py-1 rounded text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProductDietTags;
