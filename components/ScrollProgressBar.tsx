import { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollProgressBarProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  barClassName?: string;
  trackClassName?: string;
  minProgress?: number;
}

export const ScrollProgressBar = ({
  containerRef,
  className = '',
  barClassName = '',
  trackClassName = '',
  minProgress = 5
}: ScrollProgressBarProps) => {
  const [progress, setProgress] = useState(minProgress);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const newProgress = maxScroll > 0 
        ? Math.max(minProgress, (scrollTop / maxScroll) * 100)
        : minProgress;
      setProgress(newProgress);
    }
  }, [containerRef, minProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Trigger initial calculation
      handleScroll();
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [containerRef, handleScroll]);

  return (
    <div className={`h-1 bg-[#d0e6e4] ${className} ${trackClassName}`}>
      <div 
        className={`h-full bg-[#4f968f] transition-all duration-300 ease-out ${barClassName}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}; 