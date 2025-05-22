'use client';

import { useEffect } from 'react';

export function FullscreenWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Solo intentamos entrar en pantalla completa si no estamos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('[FullscreenWrapper] Skipping fullscreen in development mode');
      return;
    }

    // Detectar si es un dispositivo móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const enterFullscreen = async () => {
      try {
        // Verificar si ya estamos en pantalla completa
        if (document.fullscreenElement) {
          console.log('[FullscreenWrapper] Already in fullscreen mode');
          return;
        }

        if (isMobile) {
          // En móviles, primero intentamos la API Fullscreen
          try {
            if (document.documentElement.requestFullscreen) {
              await document.documentElement.requestFullscreen();
            } else if ((document.documentElement as any).webkitRequestFullscreen) {
              await (document.documentElement as any).webkitRequestFullscreen();
            } else if ((document.documentElement as any).msRequestFullscreen) {
              await (document.documentElement as any).msRequestFullscreen();
            }
          } catch (error) {
            console.log('[FullscreenWrapper] Fullscreen API failed on mobile, using CSS fallback');
          }

          // Siempre aplicamos el CSS fallback en móviles para asegurar el comportamiento
          document.documentElement.classList.add('fullscreen-css-fallback');

          // Añadir meta tags para mejor comportamiento en móviles
          const metaViewport = document.querySelector('meta[name="viewport"]');
          if (metaViewport) {
            metaViewport.setAttribute(
              'content',
              'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
            );
          }
        } else {
          // En desktop, usamos solo la API Fullscreen
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
          } else if ((document.documentElement as any).msRequestFullscreen) {
            await (document.documentElement as any).msRequestFullscreen();
          } else {
            console.log('[FullscreenWrapper] Using CSS fallback - Fullscreen API not available');
            document.documentElement.classList.add('fullscreen-css-fallback');
          }
        }
      } catch (error) {
        console.error('[FullscreenWrapper] Error entering fullscreen:', error);
        document.documentElement.classList.add('fullscreen-css-fallback');
      }
    };

    // Pequeño delay para asegurar que el DOM está listo
    setTimeout(enterFullscreen, 100);

    // Limpieza al desmontar
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
      document.documentElement.classList.remove('fullscreen-css-fallback');

      // Restaurar meta viewport original
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  return <div className="flex flex-col w-full min-h-screen">{children}</div>;
}
