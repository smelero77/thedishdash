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
    description?: string;
    price: number;
    image_url: string;
    category_info?: Array<{
      id: string;
      name: string;
    }>;
    food_info?: string | null;
    origin?: string | null;
    pairing_suggestion?: string | null;
    chef_notes?: string;
    calories_est_min?: number;
    calories_est_max?: number;
    is_vegetarian_base?: boolean;
    is_vegan_base?: boolean;
    is_gluten_free_base?: boolean;
    is_available?: boolean;
    is_recommended?: boolean;
    profit_margin?: number;
    modifiers?: any[];
    item_type?: string;
    is_alcoholic?: boolean;
    is_new_item?: boolean;
    is_seasonal?: boolean;
  };
  explanation: string;
}

export interface ProductDetailsResponse {
  type: 'product_details';
  content: string;
  product: ProductDetails;
}

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
    'recommendation',
    'product_details',
    'error'
  ]),
  content: z.string(),
  data: z.array(RecommendationSchema).optional(),
  product: z.object({
    item: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      image_url: z.string(),
      category_info: z.array(z.object({
        id: z.string(),
        name: z.string()
      })).optional(),
      food_info: z.string().nullable().optional(),
      origin: z.string().nullable().optional(),
      pairing_suggestion: z.string().nullable().optional(),
      chef_notes: z.string().optional(),
      calories_est_min: z.number().optional(),
      calories_est_max: z.number().optional(),
      is_vegetarian_base: z.boolean().optional(),
      is_vegan_base: z.boolean().optional(),
      is_gluten_free_base: z.boolean().optional()
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
  message_index?: number;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ConversationContext {
  sessionId: string;
  turns: ConversationTurn[];
  currentFilters: Record<string, unknown>;
  lastRecommendations?: Recommendation[];
  error?: ChatError;
}

// Interfaces para la respuesta del asistente
export interface AssistantResponse {
  type: string;
  content: string;
  clarification_points?: string[];
  data?: Recommendation[];
  product?: ProductDetails;
  error?: ChatError;
} 