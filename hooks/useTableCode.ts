import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const validateTableCode = async (code: string | null) => {
  if (!code) return null;

  try {
    const { data, error } = await supabase
      .from('table_codes')
      .select('table_number')
      .eq('id', code)
      .single();

    if (error || !data) {
      window.location.href = '/invalid';
      return null;
    }

    localStorage.setItem('gourmeton_table_code', code);
    localStorage.setItem('gourmeton_table_number', data.table_number.toString());
    return data.table_number;
  } catch (error) {
    console.error('Error validating table code:', error);
    window.location.href = '/invalid';
    return null;
  }
}; 