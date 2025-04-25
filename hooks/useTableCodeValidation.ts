import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface TableData {
  id: string;
  table_number: number;
}

interface ValidationResult {
  isLoading: boolean;
  isValid: boolean | null;
  tableData: TableData | null;
  error: Error | null;
}

// Función para validar formato UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function useTableCodeValidation(code: string | null) {
  const [result, setResult] = useState<ValidationResult>({
    isLoading: true,
    isValid: null,
    tableData: null,
    error: null,
  });

  useEffect(() => {
    // Si no hay código, no validamos
    if (!code) {
      console.log('[useTableCodeValidation] No hay código para validar');
      setResult({
        isLoading: false,
        isValid: null,
        tableData: null,
        error: null,
      });
      return;
    }

    // Validar formato UUID
    if (!isValidUUID(code)) {
      console.log('[useTableCodeValidation] Formato de UUID inválido:', code);
      setResult({
        isLoading: false,
        isValid: false,
        tableData: null,
        error: new Error('El código tiene un formato inválido. Debe ser un código QR válido del restaurante.'),
      });
      return;
    }

    console.log('[useTableCodeValidation] Iniciando validación de código:', code);
    
    const validateCode = async () => {
      setResult(prev => ({ ...prev, isLoading: true }));
      
      try {
        console.log('[useTableCodeValidation] Consultando a Supabase con código:', code);
        const { data, error } = await supabase
          .from('table_codes')
          .select('id, table_number')
          .eq('id', code)
          .single();

        if (error) {
          console.error('[useTableCodeValidation] Error de Supabase:', error);
          setResult({
            isLoading: false,
            isValid: false,
            tableData: null,
            error: new Error('El código de mesa no es válido'),
          });
          return;
        }

        if (!data) {
          console.log('[useTableCodeValidation] No se encontraron datos para el código:', code);
          setResult({
            isLoading: false,
            isValid: false,
            tableData: null,
            error: new Error('Código de mesa no encontrado'),
          });
          return;
        }

        // Si llegamos aquí, el código es válido
        console.log('[useTableCodeValidation] Código válido, datos:', data);
        setResult({
          isLoading: false,
          isValid: true,
          tableData: data as TableData,
          error: null,
        });

        // Guardar en localStorage para uso futuro
        if (typeof window !== 'undefined') {
          localStorage.setItem('gourmeton_table_code', code);
          localStorage.setItem('gourmeton_table_number', data.table_number.toString());
        }
      } catch (error) {
        console.error('[useTableCodeValidation] Error inesperado:', error);
        setResult({
          isLoading: false,
          isValid: false,
          tableData: null,
          error: error instanceof Error ? error : new Error('Error desconocido al validar el código'),
        });
      }
    };

    validateCode();
  }, [code]);

  return result;
} 