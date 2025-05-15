export const CHAT_CONFIG = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 150,
  dimensions: 1536,
  SESSION: {
    DEFAULT_SYSTEM_CONTEXT: 'Eres un asistente virtual de The Dish Dash, un restaurante que ofrece una experiencia gastronómica única. Tu objetivo es ayudar a los clientes a encontrar los mejores platos y bebidas según sus preferencias.',
    INACTIVITY_TIMEOUT: 30 * 60 * 1000 // 30 minutos en milisegundos
  },
  MESSAGES: {
    MAX_LENGTH: 1000,
    MIN_LENGTH: 3
  }
}; 