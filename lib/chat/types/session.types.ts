import { z } from 'zod';
import { CHAT_SESSION_STATES } from '../constants/config';
import { ExtractedFilters } from './extractedFilters.types';
import { ConversationTurn } from './response.types';

// Esquema para la sesión de chat
export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  alias_mesa: z.string(),
  cliente_id: z.string().uuid(),
  started_at: z.date(),
  last_active: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
  system_context: z.string().optional(),
  menu_items: z.record(z.unknown()).optional(),
  time_of_day: z.string().optional(),
  state: z.enum([
    CHAT_SESSION_STATES.INITIAL,
    CHAT_SESSION_STATES.COLLECTING_PREFERENCES,
    CHAT_SESSION_STATES.RECOMMENDING,
    CHAT_SESSION_STATES.CONFIRMING,
    CHAT_SESSION_STATES.COMPLETED,
    CHAT_SESSION_STATES.ERROR
  ]),
  current_filters: z.record(z.unknown()).optional(),
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.date()
  }))
});

// Tipo derivado del esquema
export type ChatSession = z.infer<typeof ChatSessionSchema>;

// Interfaces adicionales para el manejo de sesiones
export interface SessionState {
  currentState: typeof CHAT_SESSION_STATES[keyof typeof CHAT_SESSION_STATES];
  filters: ExtractedFilters;
  conversationHistory: ConversationTurn[];
  lastRecommendations?: string[]; // IDs de los ítems recomendados
  error?: {
    code: string;
    message: string;
  };
}

export interface SessionMetadata {
  tableNumber: string;
  timeOfDay: string;
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