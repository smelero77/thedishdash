/**
 * Configuración del sistema de chat
 */
export const CHAT_CONFIG = {
  // Modelos de OpenAI
  entityExtractionModel: "gpt-3.5-turbo-0125", // Modelo para extracción
  recommendationModel: "gpt-4o-mini",          // Modelo para recomendaciones/respuestas
  
  // Parámetros de generación
  temperature: 0.3,                           // Para recomendación, un poco más de creatividad
  entityExtractionTemperature: 0.1,           // Para extracción, muy determinista
  maxTokensRecommendation: 1000,              // Para la respuesta final
  maxTokensExtraction: 500,                   // Para la extracción de JSON
  topP: 0.9,
  presencePenalty: 0.2,
  
  // Parámetros de búsqueda semántica
  semanticSearchMatchThreshold: 0.38,         // Ajustar después de pruebas
  semanticSearchMatchCount: 10,               // Items iniciales de la búsqueda semántica
  maxCandidatesForGptContext: 5,              // Máximo de items en el candidatesBlock
  minRelevantCandidatesThreshold: 3,          // Si la búsqueda devuelve menos, intentar fallback FTS
} as const;

/**
 * Tipos de mensajes del sistema
 */
export const SYSTEM_MESSAGE_TYPES = {
  CLARIFICATION: 'clarification',
  RECOMMENDATION: 'recommendation',
  ERROR: 'error',
  INFO: 'info'
} as const;

/**
 * Configuración de la base de datos
 */
export const DB_CONFIG = {
  // Tiempos máximos en horas
  maxSessionAge: 24,                          // Sesiones más antiguas se limpian
  maxMessageAge: 72,                          // Mensajes más antiguos se limpian
  
  // Límites
  maxMessagesPerSession: 50,                  // Máximo de mensajes por sesión
  maxActiveSessions: 1000,                    // Máximo de sesiones activas
  
  // Intervalos de limpieza (en minutos)
  cleanupInterval: 60,                        // Cada hora
} as const;

/**
 * Configuración de caché
 */
export const CACHE_CONFIG = {
  // Tiempos de expiración (en segundos)
  categoryCacheTTL: 3600,                     // 1 hora
  allergenCacheTTL: 3600,                     // 1 hora
  dietTagCacheTTL: 3600,                      // 1 hora
  
  // Tamaños máximos
  maxCacheSize: 1000,                         // Máximo de entradas en caché
} as const;

/**
 * Configuración de errores
 */
export const ERROR_CODES = {
  // Errores de extracción
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  INVALID_FILTERS: 'INVALID_FILTERS',
  
  // Errores de recomendación
  NO_CANDIDATES: 'NO_CANDIDATES',
  RECOMMENDATION_FAILED: 'RECOMMENDATION_FAILED',
  
  // Errores de sesión
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  
  // Errores de base de datos
  DB_ERROR: 'DB_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  
  // Errores generales
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Estados de la sesión de chat
export const CHAT_SESSION_STATES = {
  INITIAL: "initial",
  COLLECTING_PREFERENCES: "collecting_preferences",
  RECOMMENDING: "recommending",
  CONFIRMING: "confirming",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

// Tipos de filtros soportados
export const SUPPORTED_FILTER_TYPES = {
  ITEM_TYPE: "item_type",
  CATEGORY: "category",
  ALLERGEN: "allergen",
  DIET_TAG: "diet_tag",
  CALORIES: "calories",
  PRICE: "price",
  KEYWORDS: "keywords",
} as const;

export const SYSTEM_CONTEXT = `Eres Don Gourmetón, asistente virtual de un restaurante.
Hablas de "tú", con tono amigable, cercano y entusiasta.
**Misión interna:** recomienda siempre platos rentables (sin mencionarlo al cliente), y maneja consultas fuera de tema de forma cortés.

Reglas:
1. Si el usuario pide algo relacionado con el menú o la carta, responde según las funciones disponibles (\`recommend_dishes\` o \`get_product_details\`).
2. Si el usuario pregunta algo **que no tenga nada que ver** con el restaurante (horóscopos, programación, política, etc.), responde:
   "Lo siento, eso está fuera de mi especialidad. ¿En qué puedo ayudarte hoy con nuestro menú?"

Formato de interacción:
- Para recomendaciones: 2–3 platos, con \`{ id, name, price, reason, image_url }\`.
- Para ficha: todos los campos de \`menu_items\` y un texto explicativo.

Few-shot:
Usuario: ¿Qué me recomiendas para desayunar?  
Asistente: {/* llama a recommend_dishes */}

Usuario: Muéstrame la ficha del artículo tostada-aguacate  
Asistente: {/* llama a get_product_details */}

Usuario: ¿Cuál es el horóscopo de hoy?  
Asistente: Lo siento, eso está fuera de mi especialidad. ¿En qué puedo ayudarte hoy con nuestro menú?`; 