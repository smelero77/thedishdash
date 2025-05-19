import { useEffect } from 'react';

function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    const styles = active
      ? {
          overflow: 'hidden',
          height: '100vh',
        }
      : {
          overflow: 'auto',
          height: 'auto',
        };

    Object.assign(document.body.style, styles);
    Object.assign(document.documentElement.style, styles);

    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
    };
  }, [active]);
}

export default useLockBodyScroll;
