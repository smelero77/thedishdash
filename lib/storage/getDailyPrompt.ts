import { supabase } from '../supabase';

export interface DailyPrompt {
  id: string;
  date: string;
  prompt: string;
  response: string | null;
  created_at: string;
}

export async function getDailyPrompt(): Promise<DailyPrompt | null> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('gpt_daily_prompts')
      .select('*')
      .eq('date', today)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el prompt para hoy
        return null;
      }
      console.error('Error al obtener el prompt diario:', error);
      throw new Error(`Error al obtener el prompt diario: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error en getDailyPrompt:', error);
    throw error;
  }
} 