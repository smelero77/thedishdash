export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  maxTokens: number;
}

export interface EmbeddingResponse {
  object: string;
  embedding: number[];
  index: number;
}

export interface EmbeddingError {
  code: string;
  message: string;
  details?: any;
}
