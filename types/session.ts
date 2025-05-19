import { MenuItemData } from './menu';

/**
 * Representa una sesión de usuario en The Dish Dash.
 * Una sesión mantiene el estado de la interacción del usuario con el sistema,
 * incluyendo el contexto del sistema, los ítems del menú y el tiempo del día.
 */
export interface Session {
  id: string;
  system_context: string;
  menu_items: MenuItemData[];
  time_of_day: string;
  created_at: string;
  updated_at: string;
  // Campos adicionales que podrían ser útiles
  last_active?: string;
  alias_mesa?: string;
  cliente_id?: string;
}

/**
 * Representa un mensaje en una sesión de The Dish Dash.
 * Los mensajes pueden ser enviados por el usuario, el sistema o el personal.
 */
export interface Message {
  id: string;
  session_id: string;
  sender: string;
  content: string;
  created_at: string;
  // Campos adicionales que podrían ser útiles
  type?: 'text' | 'system' | 'error';
  metadata?: Record<string, any>;
}

/**
 * Representa el estado de una sesión activa.
 * Incluye información sobre la mesa, el cliente y el estado actual.
 */
export interface SessionState {
  session_id: string;
  table_number: string;
  client_alias: string;
  is_active: boolean;
  current_slot?: string;
  last_interaction: string;
}
