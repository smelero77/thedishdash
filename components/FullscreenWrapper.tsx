'use client';

import { useEffect } from 'react';

export function FullscreenWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        // Intentar usar la API Fullscreen nativa
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          // Safari
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          // IE11
          await (document.documentElement as any).msRequestFullscreen();
        } else {
          // Fallback a CSS si la API no está disponible
          console.log('[FullscreenWrapper] Using CSS fallback - Fullscreen API not available');
          document.documentElement.classList.add('fullscreen-css-fallback');
        }
      } catch (error) {
        console.error('[FullscreenWrapper] Error entering fullscreen:', error);
        // Fallback a CSS si hay error
        document.documentElement.classList.add('fullscreen-css-fallback');
      }
    };

    enterFullscreen();

    // Limpieza al desmontar
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      document.documentElement.classList.remove('fullscreen-css-fallback');
    };
  }, []);

  return <>{children}</>;
}
