import { NextRequest, NextResponse } from 'next/server';

// Por ahora, devolvemos datos simulados
// En una implementación real, esto se conectaría a una API de clima
export async function GET(request: NextRequest) {
  try {
    // Simular una llamada a una API de clima
    const weatherData = {
      temperature: 22,
      condition: 'Soleado',
      icon: '☀️'
    };

    return NextResponse.json(weatherData);

  } catch (error) {
    console.error('Error fetching weather:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch weather data', details: errorMessage },
      { status: 500 }
    );
  }
} 