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
}

export interface ProductDetails {
  item: MenuItem;
  explanation: string;
}

export type LegacyAssistantResponse = 
  | { type: "assistant_text"; content: string }
  | { type: "recommendations"; data: MenuRecommendation[] }
  | { type: "product_details"; data: ProductDetails };

// Nuevos esquemas y tipos para el sistema modular
export const RecommendationSchema = z.object({
  menu_item_id: z.string().uuid(),
  reason: z.string(),
  match_score: z.number().min(0).max(1)
});

export const AssistantResponseSchema = z.object({
  type: z.enum([
    SYSTEM_MESSAGE_TYPES.WELCOME,
    SYSTEM_MESSAGE_TYPES.ERROR,
    SYSTEM_MESSAGE_TYPES.RECOMMENDATION,
    SYSTEM_MESSAGE_TYPES.CLARIFICATION,
    SYSTEM_MESSAGE_TYPES.CONFIRMATION
  ]),
  content: z.string(),
  recommendations: z.array(RecommendationSchema).optional(),
  clarification_points: z.array(z.string()).optional(),
  error: z.object({
    code: z.string(),
    message: z.string()
  }).optional()
});

// Tipos derivados de los esquemas
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

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