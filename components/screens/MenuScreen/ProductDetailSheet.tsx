import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import ReactDOM from 'react-dom';

interface ProductDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: any; // Cambia a MenuItemData o el tipo correcto cuando lo integres
  children?: React.ReactNode;
}

const sheetVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { 
    y: '-120px', 
    opacity: 1, 
    transition: { 
      type: 'spring', 
      stiffness: 200, 
      damping: 25 
    } 
  },
  exit: { 
    y: '100%', 
    opacity: 0, 
    transition: { 
      duration: 0.2 
    } 
  },
};

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({ isOpen, onClose, product, children }) => {
  const controls = useAnimation();
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 100], [1, 0]);

  const handleDragEnd = async (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.y > threshold) {
      await controls.start("exit");
      onClose();
    } else {
      controls.start("visible");
    }
  };

  const sheet = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={sheetVariants}
          onClick={onClose}
        >
          <motion.div
            className="w-full bg-white rounded-t-3xl shadow-xl p-0 relative max-h-[98vh]"
            onClick={e => e.stopPropagation()}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
            animate={controls}
          >
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              aria-label="Cerrar ficha"
              className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/60 text-[#0e1b19] hover:bg-white/80 shadow-md focus:outline-none focus:ring-2 focus:ring-[#1ce3cf]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Aquí irán los subcomponentes modulares */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof window !== 'undefined') {
    return ReactDOM.createPortal(sheet, document.body);
  }
  return null;
};

export default ProductDetailSheet; 