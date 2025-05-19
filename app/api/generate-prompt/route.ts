import { NextResponse } from 'next/server';
import { getPromptContextFromSupabase } from '@/lib/context/getPromptContextFromSupabase';
import { buildSystemPrompt, buildPromptContext } from '@/lib/context/promptContextBuilder';
import { saveDailyPrompt } from '@/lib/storage/saveDailyPrompt';

export async function GET() {
  try {
    // 1. Obtener el contexto del menú
    const menuContext = await getPromptContextFromSupabase();
    const context = await buildPromptContext();

    // 2. Construir el prompt base
    const prompt = buildSystemPrompt(context);

    // 3. Guardar el prompt en la base de datos
    await saveDailyPrompt(prompt);

    return NextResponse.json({ success: true, message: 'Prompt generado y guardado correctamente' });
  } catch (error) {
    console.error('Error al generar el prompt:', error);
    return NextResponse.json(
      { error: 'Error al generar el prompt' },
      { status: 500 }
    );
  }
} 