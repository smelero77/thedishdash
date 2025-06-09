import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Category } from '@/types/menu';
import { X } from 'lucide-react';

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay con fondo semitransparente */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-lg"
            style={{ height: 'calc(100vh - 200px)' }}
          >
            {/* Indicador de arrastre */}
            <div className="absolute top-0 left-0 right-0 flex justify-center pt-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="h-full flex flex-col pt-6">
              {/* Botón de cerrar */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={onClose}
                  className="p-2 -m-2 text-[#4f968f] hover:text-[#1ce3cf] active:scale-95 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Header */}
              <div className="px-4 py-2">
                <h2 className="text-lg font-semibold text-[#0e1b19]">Categorías</h2>
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
        </>
      )}
    </AnimatePresence>
  );
};

export default CategoryFilterModal; 