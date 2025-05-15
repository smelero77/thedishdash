export interface EmbeddingConfig {
  model: string;
  dimensions: number;
}

export interface EmbeddingResponse {
  object: string;
  embedding: number[];
  index: number;
} 