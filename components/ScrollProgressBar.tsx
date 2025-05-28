'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface ScrollProgressBarProps {
  containerRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export function ScrollProgressBar({ containerRef, className }: ScrollProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Si no nos pasan containerRef, caeremos en window/document
    const containerEl = containerRef?.current ?? window;
    const scrollListener = () => {
      const scrollTop =
        containerEl === window ? window.scrollY : (containerEl as HTMLElement).scrollTop;
      const scrollHeight =
        containerEl === window
          ? document.documentElement.scrollHeight - window.innerHeight
          : (containerEl as HTMLElement).scrollHeight - (containerEl as HTMLElement).clientHeight;
      setProgress(scrollTop / scrollHeight);
    };

    containerEl.addEventListener('scroll', scrollListener);
    return () => containerEl.removeEventListener('scroll', scrollListener);
  }, [containerRef]);

  return (
    <div className={cn('relative h-1', className)}>
      {/* Línea base gris */}
      <div className="absolute inset-0 bg-[#d0e6e4]" />
      {/* Barra de progreso */}
      <div
        className="absolute inset-0 bg-[#1ce3cf] transition-transform duration-150"
        style={{
          transform: `scaleX(${progress})`,
          transformOrigin: 'left',
        }}
      />
    </div>
  );
}
