import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Category } from '@/types/menu';
import { ArrowLeft } from 'lucide-react';

interface CategoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  activeCategoryFilters: string[];
  onCategoryFilter: (categoryId: string) => void;
}

const CategoryFilterModal: React.FC<CategoryFilterModalProps> = ({
  isOpen,
  onClose,
  categories,
  activeCategoryFilters,
  onCategoryFilter,
}) => {
  if (!isOpen) return null;

  console.log('Categories with images:', categories.map(cat => ({ name: cat.name, image_url: cat.image_url })));

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-lg"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#d0e6e4]">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 -m-2 text-[#4f968f] hover:text-[#1ce3cf] active:scale-95 transition-all"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-[#0e1b19]">Categorías</h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategoryFilter(category.id)}
                  className={`flex flex-col items-center space-y-2 ${
                    activeCategoryFilters.includes(category.id)
                      ? 'text-[#1ce3cf]'
                      : 'text-gray-600'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 relative">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#e0f2f1]">
                        <span className="text-2xl text-[#4f968f]">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-center">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryFilterModal; 