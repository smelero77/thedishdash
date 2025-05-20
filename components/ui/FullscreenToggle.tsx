'use client';

import React, { useState, useEffect, useCallback, HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface FullscreenToggleProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  labelPosition?: 'left' | 'right' | 'top' | 'bottom';
  initialVisualState?: boolean;
  onVisualToggle?: (isToggled: boolean) => void;
}

const FullscreenToggle: React.FC<FullscreenToggleProps> = ({
  label = 'Pantalla Completa',
  labelPosition = 'left',
  initialVisualState = false,
  onVisualToggle,
  className,
  ...props
}) => {
  const [isUIToggled, setIsUIToggled] = useState(initialVisualState);
  const [isFullscreenBrowser, setIsFullscreenBrowser] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  const getFullscreenElement = useCallback((): Element | null => {
    if (typeof document === 'undefined') return null;
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      null
    );
  }, []);

  const handleFullscreenBrowserChange = useCallback(() => {
    const currentBrowserState = !!getFullscreenElement();
    setIsFullscreenBrowser(currentBrowserState);
    setIsUIToggled(currentBrowserState);
    if (onVisualToggle) {
      onVisualToggle(currentBrowserState);
    }
  }, [getFullscreenElement, onVisualToggle]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const apiAvailable = !!(
        document.documentElement.requestFullscreen ||
        (document.documentElement as any).mozRequestFullScreen ||
        (document.documentElement as any).webkitRequestFullscreen ||
        (document.documentElement as any).msRequestFullscreen
      );
      setIsApiAvailable(apiAvailable);

      if (apiAvailable) {
        document.addEventListener('fullscreenchange', handleFullscreenBrowserChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenBrowserChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenBrowserChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenBrowserChange);
        handleFullscreenBrowserChange();
      }
      return () => {
        if (apiAvailable) {
          document.removeEventListener('fullscreenchange', handleFullscreenBrowserChange);
          document.removeEventListener('webkitfullscreenchange', handleFullscreenBrowserChange);
          document.removeEventListener('mozfullscreenchange', handleFullscreenBrowserChange);
          document.removeEventListener('MSFullscreenChange', handleFullscreenBrowserChange);
        }
      };
    }
  }, [handleFullscreenBrowserChange]);

  const handleClick = () => {
    const newUIToggledState = !isUIToggled;
    setIsUIToggled(newUIToggledState);
    if (onVisualToggle) {
      onVisualToggle(newUIToggledState);
    }
  };

  useEffect(() => {
    setIsUIToggled(initialVisualState);
  }, [initialVisualState]);

  if (!isApiAvailable) {
    return null;
  }

  const labelElement = label && <span className="text-sm font-medium text-white">{label}</span>;

  return (
    <div
      className={cn(
        'group flex items-center gap-2 cursor-pointer select-none',
        labelPosition === 'top' || labelPosition === 'bottom' ? 'flex-col' : 'flex-row',
        className,
      )}
      onClick={handleClick}
      role="switch"
      aria-checked={isUIToggled}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      {...props}
    >
      {labelPosition === 'left' || labelPosition === 'top' ? labelElement : null}
      <div
        className={cn(
          'relative inline-flex items-center h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out',
          isUIToggled ? 'bg-[#1ce3cf]' : 'bg-white/30 group-hover:bg-white/40',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
            isUIToggled ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </div>
      {labelPosition === 'right' || labelPosition === 'bottom' ? labelElement : null}
    </div>
  );
};

export default FullscreenToggle;
