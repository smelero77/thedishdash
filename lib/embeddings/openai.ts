import OpenAI from 'openai';
import { EmbeddingConfig, EmbeddingService } from './types';

export class OpenAIEmbeddingService implements EmbeddingService {
  private openai: OpenAI;
  private config: EmbeddingConfig;

  constructor(apiKey: string, config: EmbeddingConfig) {
    this.openai = new OpenAI({ apiKey });
    this.config = config;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.config.model,
      input: text,
      encoding_format: this.config.encodingFormat,
    });
    return response.data[0].embedding;
  }

  // Los otros métodos se implementarán en el servicio principal
  async searchSimilar(query: string, limit: number = 5): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  async updateEmbeddings(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getEmbedding(itemId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
} 