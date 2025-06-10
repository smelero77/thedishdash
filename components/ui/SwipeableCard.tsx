import { motion } from 'framer-motion';
import { useGestures } from '@/hooks/useGestures';
import { ReactNode } from 'react';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  className?: string;
}

export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  className = '',
}: SwipeableCardProps) => {
  const gestureProps = useGestures({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
  });

  return (
    <motion.div
      {...gestureProps}
      className={`relative touch-manipulation ${className}`}
      style={{
        x: gestureProps.x,
        y: gestureProps.y,
      }}
    >
      {children}
    </motion.div>
  );
};
