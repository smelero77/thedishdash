export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  maxTokens: number;
}

export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  maxTokens: 8191
}; 