import { useState, useEffect } from 'react';

function getIsLandscape(): boolean {
  // Comentamos temporalmente la detección de orientación
  return false;
  /* if (typeof window === 'undefined') {
    return false;
  }
  if (window.screen && window.screen.orientation) {
    return window.screen.orientation.type.startsWith('landscape');
  }
  return window.matchMedia('(orientation: landscape)').matches; */
}

export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState<boolean>(getIsLandscape());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOrientationChange = () => {
      setIsLandscape(getIsLandscape());
    };

    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
      window.addEventListener('resize', handleOrientationChange);
    }

    return () => {
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('resize', handleOrientationChange);
      }
    };
  }, []);

  return isLandscape;
}
