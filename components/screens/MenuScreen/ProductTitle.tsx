import React from 'react';
import { cn } from '@/utils/cn';

interface ProductTitleProps {
  name: string;
  className?: string;
}

const ProductTitle: React.FC<ProductTitleProps> = ({ name, className }) => {
  return (
    <h2
      className={cn(
        'text-2xl font-bold text-[#0e1b19] break-words whitespace-normal w-full',
        className,
      )}
    >
      {name}
    </h2>
  );
};

export default ProductTitle;
