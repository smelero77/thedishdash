import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import ReactDOM from 'react-dom';

interface ProductDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: any; // Cambia a MenuItemData o el tipo correcto cuando lo integres
  children?: React.ReactNode;
}

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  isOpen,
  onClose,
  product,
  children,
}) => {
  const dragControls = useDragControls();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const sheet = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay con fondo semitransparente */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isVisible ? 0 : '100%' }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
              mass: 0.8,
            }}
            className="fixed inset-0 z-50 bg-white rounded-t-3xl shadow-lg flex flex-col"
            style={{ top: 'auto' }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(event, info) => {
              if (info.offset.y > 100) {
                handleClose();
              }
            }}
          >
            {/* Indicador de arrastre */}
            <div
              className="absolute top-0 left-0 right-0 flex justify-center pt-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Botón de cerrar */}
            <button
              onClick={handleClose}
              aria-label="Cerrar ficha"
              className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/60 text-[#0e1b19] shadow-md active:bg-white/80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto">
              <div
                className="h-full"
                style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
              >
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof window !== 'undefined') {
    return ReactDOM.createPortal(sheet, document.body);
  }
  return null;
};

export default ProductDetailSheet;
