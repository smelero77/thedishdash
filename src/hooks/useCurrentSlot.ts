import { useState, useEffect } from 'react';

interface Slot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export const useCurrentSlot = () => {
  const [currentSlot, setCurrentSlot] = useState<Slot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentSlot = async () => {
      try {
        const response = await fetch('/api/slots/current');
        if (!response.ok) {
          throw new Error('Failed to fetch current slot');
        }
        const data = await response.json();
        setCurrentSlot(data);
      } catch (err) {
        console.error('Error fetching current slot:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch current slot');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentSlot();
  }, []);

  return { currentSlot, isLoading, error };
}; 