import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Interfaces basadas en el esquema real
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  food_info?: string;
  origin?: string;
  pairing_suggestion?: string;
  chef_notes?: string;
  is_recommended?: boolean;
  profit_margin?: number;
  category_ids?: string[];
}

interface Allergen {
  id: string;
  name: string;
  icon_url?: string;
}

interface DietTag {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  sort_order?: number;
  is_complementary?: boolean;
  image_url?: string;
}

interface Modifier {
  id: string;
  name: string;
  description?: string;
  required?: boolean;
  multi_select?: boolean;
  options?: ModifierOption[];
}

interface ModifierOption {
  id: string;
  name: string;
  extra_price?: number;
  is_default?: boolean;
  icon_url?: string;
}

interface ItemDetails {
  allergens: Allergen[];
  dietTags: DietTag[];
  categories: Category[];
  modifiers: Modifier[];
}

// Interfaces para los datos de Supabase
interface SupabaseAllergenResponse {
  allergen: Allergen;
}

interface SupabaseDietTagResponse {
  diet_tag: DietTag;
}

interface SupabaseModifier {
  modifier: {
    name: string;
    description?: string;
    price_adjustment?: number;
  };
}

interface SupabaseAllergen {
  allergen: {
    name: string;
    description?: string;
  };
}

interface SupabaseDietaryInfo {
  dietary_info: {
    name: string;
    description?: string;
  };
}

interface SupabaseCategory {
  category: {
    name: string;
    description?: string;
  };
}

// Cargar variables de entorno
config({ path: resolve(__dirname, '../.env') });

// Validar variables de entorno
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

// Verificar que todas las variables de entorno necesarias estén definidas
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Inicializar clientes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float"
  });
  return response.data[0].embedding;
}

async function getItemDetails(itemId: string): Promise<ItemDetails> {
  // Obtener alérgenos
  const { data: allergens } = await supabase
    .from('menu_item_allergens')
    .select(`
      allergen:allergens (
        id,
        name,
        icon_url
      )
    `)
    .eq('menu_item_id', itemId);

  // Obtener etiquetas dietéticas
  const { data: dietTags } = await supabase
    .from('menu_item_diet_tags')
    .select(`
      diet_tag:diet_tags (
        id,
        name
      )
    `)
    .eq('menu_item_id', itemId);

  // Obtener categorías
  const { data: categories } = await supabase
    .from('menu_items')
    .select('category_ids')
    .eq('id', itemId)
    .single();

  const categoryData = categories?.category_ids ? await supabase
    .from('categories')
    .select('id, name, sort_order, is_complementary, image_url')
    .in('id', categories.category_ids) : { data: [] };

  // Obtener modificadores
  const { data: modifiers } = await supabase
    .from('modifiers')
    .select(`
      id,
      name,
      description,
      required,
      multi_select,
      options:modifier_options (
        id,
        name,
        extra_price,
        is_default,
        icon_url
      )
    `)
    .eq('menu_item_id', itemId);

  return {
    allergens: ((allergens || []) as unknown as SupabaseAllergenResponse[]).map(a => a.allergen),
    dietTags: ((dietTags || []) as unknown as SupabaseDietTagResponse[]).map(d => d.diet_tag),
    categories: (categoryData.data || []) as Category[],
    modifiers: (modifiers || []).map(m => ({
      ...m,
      options: m.options || []
    })) as Modifier[]
  };
}

async function main() {
  try {
    console.log('Obteniendo items del menú...');
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*');

    if (menuError) {
      throw menuError;
    }

    console.log(`Encontrados ${menuItems.length} items del menú`);

    // Procesar cada item
    for (const item of menuItems) {
      console.log(`Procesando item: ${item.name}`);

      // Crear texto para el embedding
      const textForEmbedding = [
        item.name,
        item.description,
        item.food_info,
        item.origin,
        item.pairing_suggestion,
        item.chef_notes
      ].filter(Boolean).join(' ');

      // Generar embedding
      const embedding = await generateEmbedding(textForEmbedding);

      // Guardar embedding
      const { error: embeddingError } = await supabase
        .from('menu_item_embeddings')
        .upsert({
          item_id: item.id,
          embedding: embedding
        }, {
          onConflict: 'item_id'
        });

      if (embeddingError) {
        console.error(`Error guardando embedding para ${item.name}:`, embeddingError);
        continue;
      }

      console.log(`Embedding guardado para ${item.name}`);
    }

    console.log('Proceso completado');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 