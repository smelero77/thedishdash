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
    y: '0%',
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      duration: 0.2,
    },
  },
};

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  isOpen,
  onClose,
  product,
  children,
}) => {
  const controls = useAnimation();
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-100, 0, 100], [0, 1, 0]);
  const scale = useTransform(y, [-100, 0, 100], [0.95, 1, 0.95]);

  const handleDragEnd = async (event: any, info: any) => {
    const threshold = 50;
    const velocity = info.velocity.y;

    if (velocity > 500 || info.offset.y > threshold) {
      await controls.start({
        y: '100%',
        opacity: 0,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 40,
          duration: 0.2,
        },
      });
      onClose();
    } else {
      await controls.start({
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
          velocity: velocity,
        },
      });
    }
  };

  const sheet = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={sheetVariants}
        >
          <motion.div
            className="w-full bg-black/50 rounded-t-3xl overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full bg-white rounded-t-3xl shadow-xl p-0 relative"
              style={{
                height: 'calc(100vh - var(--safe-area-top) - 60px)',
                paddingBottom: 'var(--safe-area-bottom)',
                y,
                opacity,
                scale,
              }}
              animate={controls}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
            >
              {/* Indicador de deslizamiento */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />

              {/* Botón de cerrar */}
              <button
                onClick={onClose}
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
              {/* Aquí irán los subcomponentes modulares */}
              {children}
            </motion.div>
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
