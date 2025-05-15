import { PostgrestError } from '@supabase/supabase-js';

export function logSupabaseError(error: PostgrestError, context: string): void {
  console.error(`[Supabase Error] ${context}:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
}

export function isSupabaseError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error &&
    'hint' in error
  );
}

export function handleSupabaseError(error: unknown, context: string): never {
  if (isSupabaseError(error)) {
    logSupabaseError(error, context);
    throw new Error(`Error en ${context}: ${error.message}`);
  }
  throw error;
} 