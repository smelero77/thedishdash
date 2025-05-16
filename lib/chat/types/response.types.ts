import { MenuItem } from '../../types/menu';
import { z } from 'zod';
import { SYSTEM_MESSAGE_TYPES } from '../constants/config';

// Tipos existentes para compatibilidad
export interface MenuRecommendation {
  id: string;
  name: string;
  price: number;
  reason: string;
  image_url: string;
  category_info: Array<{
    id: string;
    name: string;
  }>;
}

export interface ProductDetails {
  item: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
  explanation: string;
}

export type ChatResponse = 
  | { type: 'text'; content: string }
  | { type: 'recommendations'; content: string; data: MenuRecommendation[] }
  | { type: 'product_details'; content: string; product: ProductDetails }
  | { type: 'error'; content: string; error: { code: string; message: string } };

// Nuevos esquemas y tipos para el sistema modular
export const RecommendationSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  reason: z.string(),
  image_url: z.string(),
  category_info: z.array(z.object({
    id: z.string(),
    name: z.string()
  }))
});

export const ChatResponseSchema = z.object({
  type: z.enum([
    'text',
    'recommendations',
    'product_details',
    'error'
  ]),
  content: z.string(),
  data: z.array(RecommendationSchema).optional(),
  product: z.object({
    item: z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      image_url: z.string()
    }),
    explanation: z.string()
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string()
  }).optional()
});

// Tipos derivados de los esquemas
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// Interfaces para el manejo de errores
export interface ChatError {
  code: string;
  message: string;
  details?: unknown;
}

// Interfaces para el manejo de la conversación
export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversationContext {
  sessionId: string;
  turns: ConversationTurn[];
  currentFilters: Record<string, unknown>;
  lastRecommendations?: Recommendation[];
  error?: ChatError;
} 