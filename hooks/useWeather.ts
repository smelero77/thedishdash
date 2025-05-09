import { useState, useEffect } from 'react';

interface WeatherData {
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    condition: string;
  };
  loading: boolean;
  error: string | null;
}

export function useWeather(location: string): WeatherData {
  const [weatherData, setWeatherData] = useState<WeatherData>({
    current: {
      temp_c: 0,
      feelslike_c: 0,
      humidity: 0,
      condition: '',
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherData(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error al obtener datos del clima: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        // Transformar los datos al formato requerido
        const transformedData: WeatherData = {
          current: {
            temp_c: data.current.temp_c,
            feelslike_c: data.current.feelslike_c,
            humidity: data.current.humidity,
            condition: data.current.condition || 'Desconocido',
          },
          loading: false,
          error: null,
        };

        setWeatherData(transformedData);
      } catch (error) {
        setWeatherData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        }));
      }
    };

    if (location) {
      fetchWeather();
    }
  }, [location]);

  return weatherData;
} 