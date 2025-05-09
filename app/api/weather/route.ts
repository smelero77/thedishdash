import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&q=Pozuelo de Alarcon&lang=es`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();
    
    // Solo devolvemos los datos relevantes para hoy
    const todayData = {
      current: {
        temp_c: data.current.temp_c,
        feelslike_c: data.current.feelslike_c,
        humidity: data.current.humidity,
        condition: data.current.condition.text
      }
    };

    return NextResponse.json(todayData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
} 