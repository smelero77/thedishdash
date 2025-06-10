import { useCallback } from 'react';
import { useMotionValue, useTransform, useAnimation } from 'framer-motion';

interface GestureConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
}

export const useGestures = ({
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
}: GestureConfig = {}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();

  const dragEndHandler = useCallback(
    (event: any, info: any) => {
      const { offset } = info;

      if (Math.abs(offset.x) > threshold) {
        if (offset.x > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

      if (Math.abs(offset.y) > threshold) {
        if (offset.y > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }

      controls.start({ x: 0, y: 0 });
    },
    [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, controls],
  );

  const tapHandler = useCallback(() => {
    onTap?.();
  }, [onTap]);

  return {
    x,
    y,
    controls,
    dragEndHandler,
    tapHandler,
    drag: true,
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragElastic: 0.1,
    onDragEnd: dragEndHandler,
    onTap: tapHandler,
  };
};
