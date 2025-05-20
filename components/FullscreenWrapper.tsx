'use client';

import { useEffect } from 'react';

export function FullscreenWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[FullscreenWrapper] Applying CSS fallback globally.');
    document.documentElement.classList.add('fullscreen-css-fallback');
  }, []);

  return <>{children}</>;
}
