import { z } from 'zod';
import { CHAT_SESSION_STATES } from '../constants/config';
import { ExtractedFilters } from './extractedFilters.types';
import { ConversationTurn } from './response.types';

// Esquema para el mensaje del asistente con function calls
export const AssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: z.string().default(''),
  function_call: z.object({
    name: z.string(),
    arguments: z.string()
  }).optional(),
  timestamp: z.date()
});

// Esquema para el mensaje del usuario
export const UserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.string(),
  timestamp: z.date()
});

// Esquema para el mensaje del sistema
export const SystemMessageSchema = z.object({
  role: z.literal('system'),
  content: z.string(),
  timestamp: z.date()
});

// Esquema para el historial de conversación
export const ConversationHistorySchema = z.array(
  z.union([UserMessageSchema, AssistantMessageSchema, SystemMessageSchema])
);

// Esquema para la sesión de chat
export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  table_number: z.number(),
  alias: z.string(),
  started_at: z.date(),
  updated_at: z.date(),
  system_context: z.string().nullable(),
  menu_items: z.record(z.unknown()).nullable(),
  time_of_day: z.string().nullable(),
  last_recommendations: z.array(z.string()).default([]),
  rejected_items: z.array(z.string()).default([]),
  conversation_history: z.array(z.any()).optional(),
  filters: z.any().optional(),
  alias_mesa: z.string().optional()
});

// Tipo derivado del esquema
export type ChatSession = z.infer<typeof ChatSessionSchema>;

// Interfaces adicionales para el manejo de sesiones
export interface SessionState {
  currentState: typeof CHAT_SESSION_STATES[keyof typeof CHAT_SESSION_STATES];
  filters: ExtractedFilters;
  conversationHistory: ConversationTurn[];
  lastRecommendations?: string[];
  rejectedItems?: string[];
  error?: {
    code: string;
    message: string;
  };
}

export interface SessionMetadata {
  tableNumber: string;
  timeOfDay: string;
  systemContext?: string;
  menuItems?: Record<string, unknown>;
  customerPreferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    favoriteCategories?: string[];
  };
  lastActive: Date;
  sessionDuration: number; // en minutos
}

// Tipo para la respuesta de creación/actualización de sesión
export interface SessionResponse {
  success: boolean;
  sessionId: string;
  state: SessionState;
  metadata: SessionMetadata;
  error?: {
    code: string;
    message: string;
  };
}

export interface MessageMetadata {
  filters?: {
    categoryId?: string;
    priceMin?: number;
    priceMax?: number;
    main_query?: string;
    category_names?: string[];
  };
  recommendations?: {
    items: string[];
    reasons: Record<string, string>;
  };
  embedding?: number[];
  search_results?: {
    items: Array<{
      id: string;
      name: string;
      distance: number;
    }>;
  };
} 