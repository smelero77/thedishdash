import { OpenAI } from 'openai';
import { ExtractedFilters, ExtractedFiltersSchema } from '../types/extractedFilters.types';
import { ENTITY_EXTRACTION_PROMPT } from '../constants/prompts';
import { OPENAI_CONFIG } from '../constants/functions';

const OPENAI_TIMEOUT = 10000; // 10 segundos
const MAX_RETRIES = 3;

export class FilterExtractor {
  private static instance: FilterExtractor;
  private openai: OpenAI;
  private logger: Console;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: OPENAI_TIMEOUT
    });
    this.logger = console;
  }

  public static getInstance(): FilterExtractor {
    if (!FilterExtractor.instance) {
      FilterExtractor.instance = new FilterExtractor();
    }
    return FilterExtractor.instance;
  }

  /**
   * Extrae filtros y preferencias del mensaje del usuario
   */
  public async extractFilters(
    userMessage: string,
    conversationHistory?: { role: string; content: string }[]
  ): Promise<ExtractedFilters> {
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        this.logger.debug(`[FilterExtractor] Intentando extraer filtros (intento ${retries + 1}/${MAX_RETRIES})`);
        
        // Preparar el mensaje del sistema con el historial de conversación
        const systemMessage = conversationHistory
          ? `${ENTITY_EXTRACTION_PROMPT}\n\nHistorial de conversación:\n${conversationHistory
              .map(msg => `${msg.role}: ${msg.content}`)
              .join('\n')}`
          : ENTITY_EXTRACTION_PROMPT;

        // Llamar a la API de OpenAI con timeout
        const response = await Promise.race([
          this.openai.chat.completions.create({
            model: OPENAI_CONFIG.model,
            temperature: OPENAI_CONFIG.temperature,
            max_tokens: OPENAI_CONFIG.max_tokens,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userMessage }
            ],
            functions: [OPENAI_CONFIG.functions[0]]
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OpenAI API timeout')), OPENAI_TIMEOUT)
          )
        ]);

        // Obtener la respuesta y parsear el JSON
        const functionCall = response.choices[0]?.message?.function_call;
        if (!functionCall || functionCall.name !== 'extract_filters') {
          throw new Error('Invalid function call response');
        }

        const extractedData = JSON.parse(functionCall.arguments);
        
        // Validar y transformar los datos extraídos
        const validatedData = ExtractedFiltersSchema.parse(extractedData);
        
        this.logger.debug('[FilterExtractor] Filtros extraídos exitosamente:', validatedData);
        return validatedData;

      } catch (error) {
        retries++;
        this.logger.error(`[FilterExtractor] Error en intento ${retries}/${MAX_RETRIES}:`, error);
        
        if (retries === MAX_RETRIES) {
          this.logger.warn('[FilterExtractor] Fallback a main_query después de agotar reintentos');
          return {
            main_query: userMessage
          };
        }
        
        // Esperar antes de reintentar (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }

    // Este return nunca debería ejecutarse debido al return en el catch
    return { main_query: userMessage };
  }

  /**
   * Combina filtros existentes con nuevos filtros
   */
  public mergeFilters(
    existingFilters: ExtractedFilters,
    newFilters: ExtractedFilters
  ): ExtractedFilters {
    // Crear una copia de los filtros existentes
    const mergedFilters = { ...existingFilters };

    // Actualizar solo los campos que tienen valores en los nuevos filtros
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // Para arrays, combinar valores únicos
          const existingArray = Array.isArray(mergedFilters[key as keyof ExtractedFilters])
            ? mergedFilters[key as keyof ExtractedFilters] as string[]
            : [];
          const newArray = value as string[];
          const uniqueValues = Array.from(new Set([...existingArray, ...newArray]));
          mergedFilters[key as keyof ExtractedFilters] = uniqueValues as any;
        } else {
          // Para otros tipos, sobrescribir
          mergedFilters[key as keyof ExtractedFilters] = value;
        }
      }
    });

    return mergedFilters;
  }

  /**
   * Limpia y normaliza los filtros
   */
  public normalizeFilters(filters: ExtractedFilters): ExtractedFilters {
    const normalized = { ...filters };

    // Normalizar arrays
    ['category_names', 'exclude_allergen_names', 'include_diet_tag_names', 'keywords_include'].forEach(
      (key) => {
        if (Array.isArray(normalized[key as keyof ExtractedFilters])) {
          normalized[key as keyof ExtractedFilters] = (
            normalized[key as keyof ExtractedFilters] as string[]
          )
            .map(item => item.trim().toLowerCase())
            .filter(item => item.length > 0) as any;
        }
      }
    );

    // Normalizar main_query
    if (normalized.main_query) {
      normalized.main_query = normalized.main_query.trim();
    }

    return normalized;
  }
}

// Exportar una instancia singleton
export const filterExtractor = FilterExtractor.getInstance(); 