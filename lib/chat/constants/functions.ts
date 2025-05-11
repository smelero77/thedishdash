export const recommendDishesFn = {
  name: "recommend_dishes",
  description: "Elige 2–3 platos y devuelve también las categorías (id + nombre).",
  parameters: {
    type: "object",
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            price: { type: "number" },
            reason: { type: "string" },
            image_url: { type: "string" },
            category_info: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string" }
                },
                required: ["id", "name"]
              }
            }
          },
          required: ["id", "name", "price", "reason", "image_url", "category_info"]
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