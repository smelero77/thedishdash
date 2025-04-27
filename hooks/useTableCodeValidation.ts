import { useState } from 'react';
import { getTableByCode, TableData } from '@/lib/data';
import { useTable } from '@/context/TableContext';

interface ValidationResult {
  table: TableData | null;
  error: string | null;
}

export function useTableCodeValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTableNumber } = useTable();

  const validateCode = async (code: string): Promise<ValidationResult> => {
    console.log('[useTableCodeValidation] Iniciando validación:', { code });
    setIsValidating(true);
    setError(null);

    try {
      const { data, error } = await getTableByCode(code);
      console.log('[useTableCodeValidation] Resultado Supabase:', { data, error });

      if (error) {
        console.log('[useTableCodeValidation] Error en validación:', error);
        setError(error.message);
        return { table: null, error: error.message };
      }

      if (!data) {
        console.log('[useTableCodeValidation] Mesa no encontrada');
        setError('Mesa no encontrada');
        return { table: null, error: 'Mesa no encontrada' };
      }

      console.log('[useTableCodeValidation] Mesa válida encontrada:', data);
      setTableNumber(data.table_number);
      return { table: data, error: null };
    } catch (err) {
      console.error('[useTableCodeValidation] Error inesperado:', err);
      setError('Error al validar la mesa');
      return { table: null, error: 'Error al validar la mesa' };
    } finally {
      setIsValidating(false);
      console.log('[useTableCodeValidation] Estado final:', { isValidating, error });
    }
  };

  return {
    validateCode,
    isValidating,
    error
  };
} 