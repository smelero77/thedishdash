import { useEffect } from 'react';

export const useCategoryScroll = (activeTab: string) => {
  useEffect(() => {
    if (!activeTab) return;
    const element = document.getElementById(`category-${activeTab}`);
    if (element) {
      const offset = element.getBoundingClientRect().top + window.pageYOffset - 180;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [activeTab]);
};
