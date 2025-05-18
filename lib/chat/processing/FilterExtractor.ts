import { OpenAI } from 'openai';
import { ExtractedFilters, ExtractedFiltersSchema } from '../types/extractedFilters.types';
import { ENTITY_EXTRACTION_PROMPT } from '../constants/prompts';
import { OPENAI_CONFIG } from '../constants/functions';
import { buildPromptContext, buildSystemPrompt } from '../../context/promptContextBuilder';

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
    
    // Verificación rápida para palabras clave de precio - Mejorada con más patrones
    const priceFilterRegex = /\b(menos|más|mas|bajo|mayor|menor|hasta|desde|por|de)\s+(de\s+)?(\d+)(\s+euros|\s+€)?\b/i;
    const priceRangeRegex = /\bentre\s+(\d+)\s+y\s+(\d+)(\s+euros|\s+€)?\b/i;
    
    // Detección de rangos de precio (entre X y Y)
    const priceRangeMatch = userMessage.match(priceRangeRegex);
    // Detección de precios únicos (menos de X, más de Y)
    const priceMatch = userMessage.match(priceFilterRegex);
    
    const hasPriceKeywords = priceRangeMatch !== null || priceMatch !== null;
    
    // Pre-extracción de valores de precio para añadirlos al prompt
    let detectedPriceMin: number | undefined = undefined;
    let detectedPriceMax: number | undefined = undefined;
    
    if (priceRangeMatch) {
      detectedPriceMin = parseInt(priceRangeMatch[1], 10);
      detectedPriceMax = parseInt(priceRangeMatch[2], 10);
      this.logger.debug('[FilterExtractor] Rango de precio detectado:', {
        min: detectedPriceMin,
        max: detectedPriceMax,
        match: priceRangeMatch[0],
        timestamp: new Date().toISOString()
      });
    } else if (priceMatch) {
      const priceValue = parseInt(priceMatch[3], 10);
      const priceOperator = priceMatch[1].toLowerCase();
      
      if (!isNaN(priceValue)) {
        if (['menos', 'menor', 'hasta', 'bajo'].includes(priceOperator)) {
          detectedPriceMax = priceValue;
        } else if (['más', 'mas', 'mayor', 'desde', 'por', 'de'].includes(priceOperator)) {
          detectedPriceMin = priceValue;
        }
        this.logger.debug('[FilterExtractor] Precio único detectado:', {
          value: priceValue,
          operator: priceOperator,
          resultingMin: detectedPriceMin,
          resultingMax: detectedPriceMax,
          match: priceMatch[0],
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Log específico para depuración de filtros de precio
    if (hasPriceKeywords) {
      this.logger.debug('[FilterExtractor] Detectadas palabras clave de precio en consulta:', {
        userMessage,
        hasPriceKeywords: true,
        detectedPriceMin,
        detectedPriceMax,
        timestamp: new Date().toISOString()
      });
    }
    
    while (retries < MAX_RETRIES) {
      try {
        this.logger.debug(`[FilterExtractor] Intentando extraer filtros (intento ${retries + 1}/${MAX_RETRIES})`);
        
        // Limitamos el historial a los últimos 5 turnos para no sobrecargar el contexto
        const limitedHistory = conversationHistory 
          ? conversationHistory.slice(-5) 
          : [];
        
        // Obtener contexto y construir prompt dinámico
        const context = await buildPromptContext();
        let systemMessage = buildSystemPrompt(context);
        this.logger.info('[FilterExtractor] PROMPT GENERADO PARA GPT (primera llamada):');
        this.logger.info(systemMessage);
        this.logger.info('[FilterExtractor] userMessage:', userMessage);
        
        if (limitedHistory && limitedHistory.length > 0) {
          const historyText = limitedHistory
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');
          systemMessage += `\n\nHistorial de conversación (MUY IMPORTANTE - UTILIZA ESTE CONTEXTO):\n${historyText}`;
          
          // Detectar si parece una consulta de seguimiento
          const isFollowUpQuery = 
            userMessage.trim().toLowerCase().startsWith('y ') ||
            userMessage.trim().toLowerCase().startsWith('también ') ||
            userMessage.trim().toLowerCase().startsWith('pero ') ||
            userMessage.trim().toLowerCase().includes('menos de') ||
            userMessage.trim().toLowerCase().includes('más de') ||
            userMessage.trim().toLowerCase().includes('mas de') ||
            userMessage.trim().length < 15;
            
          if (isFollowUpQuery) {
            systemMessage += "\n\nIMPORTANTE: La consulta actual parece ser una continuación del historial anterior. Debes MANTENER el contexto (especialmente las categorías y tipos de item) mientras incorporas los nuevos filtros.";
          }
        }

        // Si se detectaron palabras clave de precio, enfatizar aún más
        if (hasPriceKeywords) {
          const priceDetails = 
            detectedPriceMin !== undefined && detectedPriceMax !== undefined 
              ? `He detectado un rango de precio entre ${detectedPriceMin}€ y ${detectedPriceMax}€.` 
              : detectedPriceMin !== undefined 
                ? `He detectado que el usuario busca productos con precio mínimo de ${detectedPriceMin}€.` 
                : detectedPriceMax !== undefined 
                  ? `He detectado que el usuario busca productos con precio máximo de ${detectedPriceMax}€.` 
                  : '';
                  
          systemMessage += `\n\nDETECTADO FILTRO DE PRECIO: ${priceDetails}\n\nEs CRÍTICO que extraigas correctamente el rango de precios. Reglas:\n- \"menos de X\", \"hasta X\" significa price_max = X\n- \"más de X\", \"desde X\" significa price_min = X\n- \"entre X y Y\" significa price_min = X, price_max = Y`;
          
          // Forzar valores pre-detectados si existen
          if (detectedPriceMin !== undefined || detectedPriceMax !== undefined) {
            systemMessage += `\n\nINCLUYE OBLIGATORIAMENTE ESTOS VALORES EN TU RESPUESTA:`;
            if (detectedPriceMin !== undefined) systemMessage += `\n- price_min: ${detectedPriceMin}`;
            if (detectedPriceMax !== undefined) systemMessage += `\n- price_max: ${detectedPriceMax}`;
          }
        }

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
            functions: [OPENAI_CONFIG.functions[0]],
            function_call: { name: 'extract_filters' } // Forzar la llamada a extract_filters
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OpenAI API timeout')), OPENAI_TIMEOUT)
          )
        ]) as OpenAI.Chat.Completions.ChatCompletion;

        // Logging para diagnóstico
        this.logger.info('[FilterExtractor] RESPUESTA CRUDA DE GPT:', JSON.stringify(response, null, 2));

        // Obtener la respuesta y parsear el JSON
        const functionCall = response.choices[0]?.message?.function_call;
        if (!functionCall || functionCall.name !== 'extract_filters') {
          this.logger.error('[FilterExtractor] Respuesta inválida:', {
            functionCall,
            response: response.choices[0]?.message
          });
          throw new Error('Invalid function call response');
        }

        const extractedData = JSON.parse(functionCall.arguments);
        this.logger.info('[FilterExtractor] JSON extraído de GPT:', extractedData);
        
        // 🚨 Corrección manual para "Cerdo"
        if (Array.isArray(extractedData.exclude_allergen_names)) {
          const hasCerdo = extractedData.exclude_allergen_names.includes("Cerdo");

          if (hasCerdo) {
            // Eliminar "Cerdo" de los alérgenos
            extractedData.exclude_allergen_names = extractedData.exclude_allergen_names.filter(
              (item: string) => item.toLowerCase() !== "cerdo"
            );

            // Asegurar que "Sin Cerdo" está en include_diet_tag_names
            if (!Array.isArray(extractedData.include_diet_tag_names)) {
              extractedData.include_diet_tag_names = [];
            }

            if (!extractedData.include_diet_tag_names.includes("Sin Cerdo")) {
              extractedData.include_diet_tag_names.push("Sin Cerdo");
            }

            this.logger.warn("[FilterExtractor] Corrección aplicada: 'Cerdo' movido de alérgeno a dieta");
          }
        }
        
        // Mostrar en el log lo que devuelve GPT para cada artículo
        console.log('🤖 RESPUESTA GPT PARA ARTÍCULO:', {
          prompt: systemMessage.substring(0, 100) + '...',
          userMessage,
          hasConversationHistory: Boolean(limitedHistory?.length),
          historyLength: limitedHistory?.length || 0,
          extractedData,
          timestamp: new Date().toISOString()
        });
        
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
      // Si el valor nuevo es nulo o undefined, mantener el valor existente
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // Para arrays, combinar valores únicos si hay elementos nuevos
          if (value.length > 0) {
            const existingArray = Array.isArray(mergedFilters[key as keyof ExtractedFilters])
              ? mergedFilters[key as keyof ExtractedFilters] as string[]
              : [];
            const newArray = value as string[];
            const uniqueValues = Array.from(new Set([...existingArray, ...newArray]));
            mergedFilters[key as keyof ExtractedFilters] = uniqueValues as any;
          }
        } 
        // Para precios, mantener condiciones específicas
        else if (key === 'price_min' || key === 'price_max') {
          mergedFilters[key as keyof ExtractedFilters] = value;
        }
        // Para main_query, combinar si es un refinamiento
        else if (key === 'main_query') {
          const existingQuery = mergedFilters.main_query || '';
          const newQuery = value as string;
          
          // Si parece ser una consulta de refinamiento pero no incluye palabras clave del contexto
          if (newQuery.length < 20 && existingQuery && !this.containsKeyContextWords(newQuery, existingQuery)) {
            mergedFilters.main_query = `${existingQuery} ${newQuery}`;
          } else {
            mergedFilters.main_query = newQuery;
          }
        }
        // Para otros tipos, sobrescribir si hay valor nuevo
        else {
          mergedFilters[key as keyof ExtractedFilters] = value;
        }
      }
    });

    // Asegurar que category_names se mantenga si no hay nuevos valores
    if (!newFilters.category_names || newFilters.category_names.length === 0) {
      // Mantener categorías existentes
    } else {
      mergedFilters.category_names = newFilters.category_names;
    }

    // Asegurar que item_type se mantenga si no hay nuevo valor
    if (!newFilters.item_type && existingFilters.item_type) {
      mergedFilters.item_type = existingFilters.item_type;
    }

    return mergedFilters;
  }
  
  /**
   * Verifica si el texto nuevo contiene palabras clave de contexto del texto existente
   */
  private containsKeyContextWords(newText: string, existingText: string): boolean {
    // Obtener palabras clave del contexto existente (omitir stopwords)
    const contextKeywords = existingText.toLowerCase().split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !['para', 'con', 'los', 'las', 'del', 'por', 'que', 'mas', 'menos'].includes(word)
      );
      
    // Verificar si alguna palabra clave está en el nuevo texto
    return contextKeywords.some(keyword => 
      newText.toLowerCase().includes(keyword)
    );
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