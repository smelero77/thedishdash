import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Category } from '@/types/menu';
import { X } from 'lucide-react';

interface CategoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategoryFilter: (categoryId: string) => void;
  onModalClose?: () => void;
  onFilterChange?: (selectedCategories: string[]) => void;
  selectedCategories: string[];
}

const CategoryFilterModal: React.FC<CategoryFilterModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoryFilter,
  onModalClose,
  onFilterChange,
  selectedCategories,
}) => {
  // Estado temporal para las selecciones dentro del modal
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>(selectedCategories);

  // Actualizar el estado temporal cuando cambian las categorías seleccionadas
  useEffect(() => {
    setTempSelectedCategories(selectedCategories);
  }, [selectedCategories]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Al cerrar sin guardar, reseteamos el estado temporal
    setTempSelectedCategories(selectedCategories);
    onClose();
    onModalClose?.();
  };

  const handleShowResults = () => {
    // Solo cuando se pulsa Mostrar resultados, guardamos los cambios
    if (onFilterChange) {
      onFilterChange(tempSelectedCategories);
    }
    handleClose();
  };

  const handleCategoryClick = (categoryId: string) => {
    setTempSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

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
            onClick={handleClose}
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

            <div className="h-full flex flex-col pt-2">
              {/* Botón de cerrar */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleClose}
                  className="p-2 -m-2 text-[#4f968f] hover:text-[#1ce3cf] active:scale-95 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Header */}
              <div className="px-4 py-1">
                <h2 className="text-lg font-semibold text-[#0e1b19]">Categorías</h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-20">
                  <div className="grid grid-cols-4 gap-4">
                    {categories.map((category) => {
                      const isActive = tempSelectedCategories.includes(category.id);
                      const rotateDeg = isActive ? -12 : 0;

                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.id)}
                          className="flex flex-col items-center"
                        >
                          <div className="relative w-20 h-20">
                            {/* 1) animamos el SVG */}
                            <motion.svg
                              className="absolute inset-0 w-full h-full"
                              viewBox="0 0 96 96"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ transformOrigin: 'center center' }}
                              initial={{ rotate: 0 }}
                              animate={{ rotate: rotateDeg }}
                              transition={{ duration: 0.3 }}
                            >
                              <path
                                d="M81 27C88.5 40.5 84 66 66 81C48 96 15 87 10.5 61.5C6 36 27 9 54 12C69 13.5 73.5 19.5 81 27Z"
                                fill={isActive ? '#d1fae5' : '#f3f4f6'}
                              />
                            </motion.svg>

                            {/* 2) animamos la foto/decoración exactamente igual */}
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center"
                              initial={{ rotate: 0 }}
                              animate={{ rotate: rotateDeg }}
                              transition={{ duration: 0.3 }}
                              style={{ transformOrigin: 'center center' }}
                            >
                              <div className="w-10 h-10 relative overflow-hidden">
                                {category.image_url ? (
                                  <Image
                                    src={category.image_url}
                                    alt={category.name}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-[#e0f2f1]">
                                    <span className="text-xl text-[#4f968f]">
                                      {category.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </div>

                          <span 
                            className="text-xs font-medium text-gray-700 text-center"
                            style={{ fontFamily: 'var(--font-montserrat)' }}
                          >
                            {category.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Mostrar resultados */}
            <div className="fixed bottom-4 left-0 right-0 z-[60] px-4">
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={handleShowResults}
                  className="w-full h-12 rounded-full bg-[#1ce3cf] text-[#0e1b19] flex items-center justify-center shadow-lg text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#1ce3cf] hover:text-[#0e1b19]"
                >
                  Mostrar resultados
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CategoryFilterModal; 