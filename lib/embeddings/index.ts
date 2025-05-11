import { OpenAIEmbeddingService } from './services/openai.service';
import type { EmbeddingConfig, EmbeddingResponse } from './types/embedding.types';

export class EmbeddingService {
  private service: OpenAIEmbeddingService;

  constructor(apiKey: string, config: EmbeddingConfig) {
    this.service = new OpenAIEmbeddingService(apiKey, config);
  }

  async getEmbedding(text: string): Promise<number[]> {
    return this.service.getEmbedding(text);
  }

  async getEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    return this.service.getEmbeddings(texts);
  }
}

export * from './types/embedding.types'; 