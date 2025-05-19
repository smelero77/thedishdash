import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { CHAT_CONFIG } from '../constants/config';
import { recommendDishesFn, getProductDetailsFn } from '../constants/functions';
import { ERROR_CODES } from '../constants/config';
import { RECOMMENDATION_SYSTEM_CONTEXT } from '../constants/prompts';
import { MenuItemData } from '@/types/menu';

interface ExtractedFilters {
  dietary?: string[];
  allergens?: string[];
  priceRange?: [number, number];
  preferences?: string[];
}

interface RecommendationResponse {
  type: 'recommendation';
  content: string;
  recommendations: Array<{
    id: string;
    reason: string;
  }>;
}

/**
 * Clase responsable de generar recomendaciones utilizando el modelo de OpenAI
 */
export class RecommendationGenerator {
  private static instance: RecommendationGenerator;
  private openai: OpenAI;

  private constructor(private openaiApiKey: string) {
    if (!openaiApiKey) {
      throw new Error('API key is required for RecommendationGenerator');
    }
    this.openai = new OpenAI({ apiKey: this.openaiApiKey });
  }

  /**
   * Obtiene la instancia singleton del generador de recomendaciones
   */
  public static getInstance(openaiApiKey: string): RecommendationGenerator {
    if (!RecommendationGenerator.instance) {
      RecommendationGenerator.instance = new RecommendationGenerator(openaiApiKey);
    }
    return RecommendationGenerator.instance;
  }

  private buildRecommendationPrompt(
    candidates: MenuItemData[],
    userMessage: string,
    filters: ExtractedFilters
  ): string {
    const filterText = this.formatFilters(filters);
    const candidatesText = candidates.map(item => 
      `- ${item.name}: ${item.description || 'Sin descripción'} (${item.price}€)`
    ).join('\n');

    return `
Mensaje del usuario: ${userMessage}

${filterText}

Platos disponibles:
${candidatesText}

Por favor, recomienda entre 3 y 4 platos que mejor se ajusten a las preferencias del usuario, considerando los filtros aplicados.
Para cada recomendación, proporciona una razón clara y concisa de por qué ese plato sería una buena opción.
`;
  }

  private formatFilters(filters: ExtractedFilters): string {
    const parts: string[] = [];

    if (filters.dietary?.length) {
      parts.push(`Preferencias dietéticas: ${filters.dietary.join(', ')}`);
    }
    if (filters.allergens?.length) {
      parts.push(`Alergias a evitar: ${filters.allergens.join(', ')}`);
    }
    if (filters.priceRange) {
      parts.push(`Rango de precio: ${filters.priceRange[0]}€ - ${filters.priceRange[1]}€`);
    }
    if (filters.preferences?.length) {
      parts.push(`Preferencias adicionales: ${filters.preferences.join(', ')}`);
    }

    return parts.length ? `Filtros aplicados:\n${parts.join('\n')}` : '';
  }

  private formatRecommendations(
    recommendations: Array<{ id: string; reason: string }>,
    candidates: MenuItemData[]
  ): string {
    return recommendations.map(rec => {
      const item = candidates.find(c => c.id === rec.id);
      if (!item) return '';

      return `${item.name} (${item.price}€)\n${rec.reason}\n`;
    }).filter(Boolean).join('\n');
  }

  /**
   * Genera una respuesta o recomendación basada en los mensajes proporcionados
   */
  public async generateResponse(
    promptMessages: ChatCompletionMessageParam[]
  ): Promise<OpenAI.Chat.Completions.ChatCompletionMessage> {
    try {
      if (!this.validatePromptMessages(promptMessages)) {
        throw new Error('Invalid prompt messages');
      }

      console.log('[RecommendationGenerator] Iniciando generación de recomendación...');
      console.log('[RecommendationGenerator] Configuración:', {
        model: CHAT_CONFIG.recommendationModel,
        temperature: CHAT_CONFIG.temperature,
        maxTokens: CHAT_CONFIG.maxTokensRecommendation,
        topP: CHAT_CONFIG.topP,
        presencePenalty: CHAT_CONFIG.presencePenalty
      });

      const response = await this.openai.chat.completions.create({
        model: CHAT_CONFIG.recommendationModel,
        messages: [
          {
            role: 'system',
            content: RECOMMENDATION_SYSTEM_CONTEXT
          },
          ...promptMessages
        ],
        functions: [recommendDishesFn, getProductDetailsFn],
        temperature: CHAT_CONFIG.temperature,
        max_tokens: CHAT_CONFIG.maxTokensRecommendation,
        top_p: CHAT_CONFIG.topP,
        presence_penalty: CHAT_CONFIG.presencePenalty,
      });

      if (!response.choices?.[0]?.message) {
        throw new Error('No response received from OpenAI');
      }

      const message = response.choices[0].message;
      
      // Si hay una llamada a función, validar que sea válida
      if (message.function_call) {
        try {
          const args = JSON.parse(message.function_call.arguments);
          if (message.function_call.name === 'recommend_dishes') {
            if (!args.recommendations || !Array.isArray(args.recommendations)) {
              console.error('[RecommendationGenerator] Error: Argumentos inválidos para recommend_dishes:', args);
              throw new Error(ERROR_CODES.RECOMMENDATION_FAILED);
            }
            // Validar cada recomendación
            for (const rec of args.recommendations) {
              if (!rec.id || !rec.reason) {
                console.error('[RecommendationGenerator] Error: Recomendación inválida:', rec);
                throw new Error(ERROR_CODES.RECOMMENDATION_FAILED);
              }
            }
          }
        } catch (error) {
          console.error('[RecommendationGenerator] Error parseando argumentos:', error);
          throw new Error(ERROR_CODES.RECOMMENDATION_FAILED);
        }
      }

      console.log('[RecommendationGenerator] Respuesta generada:', {
        role: message.role,
        content: message.content?.substring(0, 100) + '...',
        function_call: message.function_call ? 'Present' : 'None'
      });

      return message;
    } catch (error) {
      console.error('[RecommendationGenerator] Error generando recomendación:', error);
      
      // Determinar el tipo de error y lanzar el código de error apropiado
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          throw new Error(ERROR_CODES.UNKNOWN_ERROR); // Rate limit exceeded
        } else if (error.status === 401) {
          throw new Error(ERROR_CODES.UNKNOWN_ERROR); // Invalid API key
        }
      }
      
      throw new Error(ERROR_CODES.RECOMMENDATION_FAILED);
    }
  }

  /**
   * Valida que los mensajes del prompt sean válidos
   */
  private validatePromptMessages(messages: ChatCompletionMessageParam[]): boolean {
    if (!Array.isArray(messages) || messages.length === 0) {
      return false;
    }

    return messages.every(message => 
      message && 
      typeof message === 'object' && 
      'role' in message && 
      'content' in message
    );
  }

  private async generateRecommendationResponse(
    candidates: MenuItemData[],
    userMessage: string,
    filters: ExtractedFilters
  ): Promise<RecommendationResponse> {
    const prompt = this.buildRecommendationPrompt(candidates, userMessage, filters);
    
    const response = await this.openai.chat.completions.create({
      model: CHAT_CONFIG.recommendationModel,
      temperature: CHAT_CONFIG.temperature,
      max_tokens: CHAT_CONFIG.maxTokensRecommendation,
      top_p: 0.9,
      presence_penalty: 0.2,
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente experto en gastronomía que ayuda a los usuarios a encontrar platos que se ajusten a sus preferencias. SIEMPRE debes devolver entre 3 y 4 recomendaciones diferentes, a menos que haya menos candidatos disponibles.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      functions: [recommendDishesFn],
      function_call: { name: 'recommend_dishes' }
    });

    const functionCall = response.choices[0]?.message?.function_call;
    if (!functionCall || functionCall.name !== 'recommend_dishes') {
      throw new Error('Invalid function call response');
    }

    const recommendations = JSON.parse(functionCall.arguments).recommendations;
    if (!Array.isArray(recommendations) || recommendations.length < 3) {
      throw new Error('Invalid recommendations format');
    }

    return {
      type: 'recommendation',
      content: this.formatRecommendations(recommendations, candidates),
      recommendations: recommendations.map(rec => ({
        id: rec.id,
        reason: rec.reason
      }))
    };
  }
}

// Exportar una instancia singleton
export const recommendationGenerator = RecommendationGenerator.getInstance(process.env.OPENAI_API_KEY || ''); 