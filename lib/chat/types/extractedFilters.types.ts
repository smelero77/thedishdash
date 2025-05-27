import { z } from 'zod';

export const ExtractedFiltersSchema = z
  .object({
    item_type: z
      .enum(['Comida', 'Bebida'])
      .optional()
      .describe('Tipo de ítem general (Comida o Bebida).'),
    category_names: z
      .array(z.string().trim().min(1))
      .optional()
      .describe("Nombres de categorías mencionadas (ej. 'Postres')."),
    exclude_allergen_names: z
      .array(z.string().trim().min(1))
      .optional()
      .describe("Nombres de alérgenos a EVITAR (ej. 'Gluten')."),
    include_diet_tag_names: z
      .array(z.string().trim().min(1))
      .optional()
      .describe("Nombres de etiquetas dietéticas que QUIERE (ej. 'Vegano')."),
    is_vegetarian_base: z
      .boolean()
      .optional()
      .describe('Usuario busca algo explícitamente vegetariano.'),
    is_vegan_base: z.boolean().optional().describe('Usuario busca algo explícitamente vegano.'),
    is_gluten_free_base: z
      .boolean()
      .optional()
      .describe('Usuario busca algo explícitamente sin gluten.'),
    is_alcoholic: z
      .boolean()
      .optional()
      .describe('Para bebidas, preferencia por alcohólicas/no alcohólicas.'),
    calories_max: z.number().int().positive().optional().describe('Máximo de calorías.'),
    calories_min: z.number().int().positive().optional().describe('Mínimo de calorías.'),
    price_max: z.number().positive().optional().describe('Precio máximo.'),
    price_min: z.number().positive().optional().describe('Precio mínimo.'),
    keywords_include: z
      .array(z.string().trim().min(1))
      .optional()
      .describe("Otras palabras clave relevantes (ej. 'casero', 'para compartir')."),
    main_query: z
      .string()
      .trim()
      .min(1, { message: 'La consulta principal (main_query) no puede estar vacía.' })
      .describe('Consulta principal depurada para búsqueda semántica.'),
  })
  .passthrough(); // Permite campos adicionales no definidos, pero no los valida.

export type ExtractedFilters = z.infer<typeof ExtractedFiltersSchema>;

export interface RpcFilterParameters {
  p_item_type?: 'Comida' | 'Bebida';
  p_category_ids_include?: string[];
  p_slot_ids?: string[];
  p_allergen_ids_exclude?: string[];
  p_diet_tag_ids_include?: string[];
  p_is_vegetarian_base?: boolean;
  p_is_vegan_base?: boolean;
  p_is_gluten_free_base?: boolean;
  p_is_alcoholic?: boolean;
  p_calories_max?: number;
  p_calories_min?: number;
  p_price_max?: number;
  p_price_min?: number;
  p_keywords_include?: string[];
  main_query?: string;
}
