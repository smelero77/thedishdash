export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  encodingFormat: 'float' | 'base64';
}

export interface MenuItemEmbedding {
  item_id: string;
  embedding: number[];
  text: string; // El texto usado para generar el embedding
  created_at?: Date;
  updated_at?: Date;
}

export interface EmbeddingSearchResult {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  food_info: string | null;
  origin: string | null;
  pairing_suggestion: string | null;
  chef_notes: string | null;
  is_recommended: boolean;
  profit_margin: number | null;
  category_ids: string[] | null;
  similarity: number;
}

export interface MessageEmbedding {
  message_id: string;
  embedding: number[];
  created_at?: Date;
  updated_at?: Date;
}

export interface SimilarMessage {
  content: string;
  similarity: number;
}

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  searchSimilar(query: string, limit?: number): Promise<EmbeddingSearchResult[]>;
  updateEmbeddings(): Promise<void>;
  getEmbedding(itemId: string): Promise<MenuItemEmbedding | null>;
} 