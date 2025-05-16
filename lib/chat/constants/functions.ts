import { CHAT_CONFIG } from './config';

export const recommendDishesFn = {
  name: "recommend_dishes",
  description: "Elige 2–3 platos de la lista de candidatos proporcionada y explica por qué los recomiendas.",
  parameters: {
    type: "object",
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { 
              type: "string", 
              format: "uuid",
              description: "El ID EXACTO de un item de la lista de candidatos proporcionada en el contexto."
            },
            reason: { 
              type: "string",
              description: "La razón por la que este item es una buena recomendación para el usuario."
            }
          },
          required: ["id", "reason"]
        }
      }
    },
    required: ["recommendations"]
  }
};

export const getProductDetailsFn = {
  name: "get_product_details",
  description: "Recupera todos los campos de un plato dado su id",
  parameters: {
    type: "object",
    properties: {
      product_id: {
        type: "string",
        description: "ID del producto a consultar en el menú"
      }
    },
    required: ["product_id"]
  }
};

export const OPENAI_FUNCTIONS = [
  {
    name: "extract_filters",
    description: "Extrae filtros y preferencias del mensaje del usuario",
    parameters: {
      type: "object",
      properties: {
        item_type: {
          type: "string",
          enum: ["Comida", "Bebida"],
          description: "Tipo de ítem general (Comida o Bebida)"
        },
        category_names: {
          type: "array",
          items: { type: "string" },
          description: "Nombres de categorías mencionadas (ej. 'Postres')"
        },
        exclude_allergen_names: {
          type: "array",
          items: { type: "string" },
          description: "Nombres de alérgenos a EVITAR (ej. 'Gluten')"
        },
        include_diet_tag_names: {
          type: "array",
          items: { type: "string" },
          description: "Nombres de etiquetas dietéticas que QUIERE (ej. 'Vegano')"
        },
        is_vegetarian_base: {
          type: "boolean",
          description: "Usuario busca algo explícitamente vegetariano"
        },
        is_vegan_base: {
          type: "boolean",
          description: "Usuario busca algo explícitamente vegano"
        },
        is_gluten_free_base: {
          type: "boolean",
          description: "Usuario busca algo explícitamente sin gluten"
        },
        is_alcoholic: {
          type: "boolean",
          description: "Para bebidas, preferencia por alcohólicas/no alcohólicas"
        },
        calories_max: {
          type: "number",
          description: "Máximo de calorías"
        },
        calories_min: {
          type: "number",
          description: "Mínimo de calorías"
        },
        price_max: {
          type: "number",
          description: "Precio máximo"
        },
        price_min: {
          type: "number",
          description: "Precio mínimo"
        },
        keywords_include: {
          type: "array",
          items: { type: "string" },
          description: "Otras palabras clave relevantes (ej. 'casero', 'para compartir')"
        },
        main_query: {
          type: "string",
          description: "Consulta principal depurada para búsqueda semántica"
        }
      },
      required: ["main_query"]
    }
  },
  {
    name: "request_clarification",
    description: "Solicita aclaraciones al usuario sobre sus preferencias",
    parameters: {
      type: "object",
      properties: {
        clarification_points: {
          type: "array",
          items: { type: "string" },
          description: "Lista de puntos que necesitan aclaración"
        },
        reason: {
          type: "string",
          description: "Razón por la que se necesitan aclaraciones"
        }
      },
      required: ["clarification_points", "reason"]
    }
  },
  {
    name: "provide_recommendations",
    description: "Proporciona recomendaciones basadas en los filtros del usuario",
    parameters: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              menu_item_id: {
                type: "string",
                description: "ID del ítem del menú recomendado"
              },
              reason: {
                type: "string",
                description: "Razón por la que se recomienda este ítem"
              },
              match_score: {
                type: "number",
                description: "Puntuación de coincidencia con los filtros (0-1)"
              }
            },
            required: ["menu_item_id", "reason", "match_score"]
          }
        },
        summary: {
          type: "string",
          description: "Resumen de las recomendaciones"
        }
      },
      required: ["recommendations", "summary"]
    }
  }
] as const;

export const DEFAULT_FUNCTION_CALL = {
  name: "extract_filters",
  arguments: "{}"
} as const;

export const OPENAI_CONFIG = {
  model: CHAT_CONFIG.entityExtractionModel,
  temperature: CHAT_CONFIG.entityExtractionTemperature,
  max_tokens: CHAT_CONFIG.maxTokensExtraction,
  functions: OPENAI_FUNCTIONS,
  function_call: DEFAULT_FUNCTION_CALL
} as const; 