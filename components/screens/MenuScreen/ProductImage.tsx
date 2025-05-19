import React from 'react';
import Image from 'next/image';

interface ProductImageProps {
  imageUrl: string;
  alt: string;
  quantity?: number;
}

const ProductImage: React.FC<ProductImageProps> = ({ imageUrl, alt, quantity }) => (
  <div className="w-full aspect-[4/3] relative bg-gray-100 rounded-t-3xl overflow-hidden">
    <Image src={imageUrl} alt={alt} fill className="object-cover" priority />
    {quantity && quantity > 0 && (
      <div className="absolute top-0 right-0 bg-[#1ce3cf] text-[#0e1b19] text-sm px-2 py-1 rounded-bl-lg font-semibold z-10">
        {quantity}x
      </div>
    )}
  </div>
);

export default ProductImage;
