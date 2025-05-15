export interface SessionConfig {
  defaultSystemContext: string;
  inactivityTimeout: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  defaultSystemContext: 'Eres un asistente virtual de The Dish Dash, un restaurante que ofrece una experiencia gastronómica única. Tu objetivo es ayudar a los clientes a encontrar los mejores platos y bebidas según sus preferencias.',
  inactivityTimeout: 30 * 60 * 1000 // 30 minutos en milisegundos
}; 