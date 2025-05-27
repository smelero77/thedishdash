import { useEffect } from 'react';

function useActiveSection(setActiveTab: (id: string) => void) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id) {
              setActiveTab(id.replace('category-', ''));
            }
          }
        });
      },
      { threshold: 0.5 }, // Adjust threshold as needed
    );

    const elements = document.querySelectorAll('[id^="category-"]');
    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => observer.unobserve(element));
    };
  }, [setActiveTab]);
}

export default useActiveSection;
