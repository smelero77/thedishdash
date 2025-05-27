import OpenAI from 'openai';
import type { EmbeddingConfig, EmbeddingResponse } from '../types/embedding.types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

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

export class OpenAIEmbeddingService {
  private openai: OpenAI;
  private config: EmbeddingConfig;

  constructor(apiKey: string, config: EmbeddingConfig) {
    this.openai = new OpenAI({ apiKey });
    this.config = config;
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: text,
        dimensions: this.config.dimensions,
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
        dimensions: this.config.dimensions,
      });

      return response.data.map((item, index) => ({
        object: item.object,
        embedding: item.embedding,
        index,
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
        presence_penalty: opts.presence_penalty,
      });

      return response;
    } catch (error) {
      console.error('Error in chat completion:', error);
      throw new Error('Failed to get chat completion');
    }
  }
}
