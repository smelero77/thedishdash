import { supabase } from '../supabase';

export async function saveDailyPrompt(prompt: string, response?: string): Promise<void> {
  try {
    // Obtener la fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('gpt_daily_prompts').upsert(
      {
        date: today,
        prompt,
        ...(response && { response }),
      },
      {
        onConflict: 'date',
      },
    );

    if (error) {
      console.error('Error al guardar el prompt diario:', error);
      throw new Error(`Error al guardar el prompt diario: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en saveDailyPrompt:', error);
    throw error;
  }
}
