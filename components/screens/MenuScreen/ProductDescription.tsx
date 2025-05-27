import React from 'react';
import { cn } from '@/utils/cn';

interface ProductDescriptionProps {
  description: string;
  className?: string;
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const ProductDescription: React.FC<ProductDescriptionProps> = ({ description, className }) => (
  <div className="px-4 pb-2">
    <p
      className={cn(
        'text-[#4f968f] text-sm font-normal leading-normal break-words whitespace-normal w-full',
        className,
      )}
    >
      {truncateText(description, 100)}
    </p>
  </div>
);

export default ProductDescription;
