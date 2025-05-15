import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
}

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather');
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return { weather, isLoading, error };
}; 