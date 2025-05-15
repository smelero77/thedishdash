import OpenAI from 'openai';
import type { EmbeddingConfig, EmbeddingResponse } from '../types/embedding.types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getSlots } from '@/lib/data';
import { CHAT_CONFIG } from '@/lib/chat/constants/config';
import { OpenAIClient } from '../../domain/ports/OpenAIClient';
import { Filters } from '../../domain/entities/Filters';
import { AssistantResponse } from '../../domain/entities/AssistantResponse';

export interface ChatOptions {
  model: string;
  messages: ChatCompletionMessageParam[];
  functions?: any[];
  function_call?: 'auto' | 'none';
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
}

export class OpenAIService implements OpenAIClient {
  private openai: OpenAI;
  private config: EmbeddingConfig;

  constructor(apiKey: string, config: EmbeddingConfig) {
    this.openai = new OpenAI({ apiKey });
    this.config = config;
  }

  async generateResponse(messages: any[]): Promise<AssistantResponse> {
    try {
      const response = await this.openai.chat.completions.create({
        model: CHAT_CONFIG.model,
        messages,
        temperature: CHAT_CONFIG.temperature,
        max_tokens: CHAT_CONFIG.maxTokens
      });

      return {
        type: 'text',
        content: response.choices[0].message.content || ''
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async analyzeUserQuery(message: string): Promise<Filters> {
    try {
      const response = await this.openai.chat.completions.create({
        model: CHAT_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: 'Analiza el mensaje del usuario y extrae información sobre preferencias dietéticas, restricciones y preferencias de bebidas.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      });

      const analysis = response.choices[0].message.content || '';
      
      // TODO: Implementar lógica para extraer filtros del análisis
      return {
        itemType: undefined,
        isVegetarian: undefined,
        isVegan: undefined,
        isGlutenFree: undefined,
        maxCalories: undefined,
        drinkSize: undefined,
        drinkTemperature: undefined,
        drinkIce: undefined,
        isAlcoholic: undefined
      };
    } catch (error) {
      console.error('Error analyzing user query:', error);
      throw error;
    }
  }

  private async makeFunctionSchemas() {
    // 1. Cargamos dinámicamente los slots
    const slots = await getSlots();
    const slotNames = slots.map((s: { name: string }) => s.name);

    return [
      {
        name: 'filterItems',
        description: 'Filtra el catálogo por slot, calorías y etiquetas',
        parameters: {
          type: 'object',
          properties: {
            slot: {
              type: 'string',
              description: 'Nombre del slot (Desayuno, Comida, Cena, etc.)',
              enum: slotNames
            },
            maxCalories: {
              type: 'number',
              description: 'Calorías máximas deseadas'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Etiquetas dietéticas requeridas (Ligero, Saludable, Vegano...)'
            }
          },
          required: ['slot']
        }
      }
    ];
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: text,
        dimensions: this.config.dimensions
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async getEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: texts,
        dimensions: this.config.dimensions
      });

      return response.data.map((item, index) => ({
        object: item.object,
        embedding: item.embedding,
        index
      }));
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  async chat(opts: ChatOptions) {
    try {
      const response = await this.openai.chat.completions.create({
        model: opts.model,
        messages: opts.messages,
        functions: opts.functions,
        function_call: opts.function_call,
        temperature: opts.temperature,
        max_tokens: opts.max_tokens,
        top_p: opts.top_p,
        presence_penalty: opts.presence_penalty
      });

      return response;
    } catch (error) {
      console.error('Error in chat completion:', error);
      throw new Error('Failed to get chat completion');
    }
  }

  async chatWithFunctions(messages: any[]) {
    const functions = await this.makeFunctionSchemas();
    return this.openai.chat.completions.create({
      model: CHAT_CONFIG.model,
      messages,
      functions,
      temperature: CHAT_CONFIG.temperature,
      max_tokens: CHAT_CONFIG.maxTokens
    });
  }

  async createEmbedding(text: string) {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text
    });
    return response.data[0].embedding;
  }
} 