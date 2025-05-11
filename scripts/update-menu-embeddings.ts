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

// Cargar variables de entorno de .env.local
const envPath = resolve(__dirname, '../.env.local');
console.log('Loading environment variables from:', envPath);

// Forzar la carga de variables de entorno
const result = config({ path: envPath });
if (result.error) {
  console.error('Error loading .env.local:', result.error);
  process.exit(1);
}

// Verificar variables de entorno
console.log('\nEnvironment variables loaded:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Present' : '✗ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Present' : '✗ Missing');

// Verificar que las variables existen antes de continuar
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.OPENAI_API_KEY) {
  console.error('Error: Missing required environment variables');
  process.exit(1);
}

// Inicializar clientes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
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
    console.log('1. Obteniendo items del menú...');
    const { data: menuItems, error: fetchError } = await supabase
      .from('menu_items')
      .select('*');

    if (fetchError) throw fetchError;
    if (!menuItems) throw new Error('No menu items found');

    console.log(`2. Procesando ${menuItems.length} items...`);
    
    for (const item of menuItems) {
      console.log(`\nProcesando: ${item.name}`);
      
      // Obtener detalles relacionados
      const details = await getItemDetails(item.id);
      
      // Construir texto para el embedding
      const textForEmbedding = [
        // Información básica del item
        `Nombre: ${item.name}`,
        `Descripción: ${item.description || ''}`,
        `Notas del chef: ${item.chef_notes || ''}`,
        `Origen: ${item.origin || ''}`,
        `Sugerencia de maridaje: ${item.pairing_suggestion || ''}`,
        `Información nutricional: ${item.food_info || ''}`,
        
        // Alérgenos
        'Alérgenos:',
        ...details.allergens.map(a => `- ${a.name}`),
        
        // Etiquetas dietéticas
        'Etiquetas dietéticas:',
        ...details.dietTags.map(d => `- ${d.name}`),
        
        // Categorías
        'Categorías:',
        ...details.categories.map(c => `- ${c.name}`),
        
        // Modificadores
        'Modificadores:',
        ...details.modifiers.map(m => {
          const options = m.options?.map(o => 
            `  * ${o.name}${o.extra_price ? ` (+${o.extra_price}€)` : ''}`
          ).join('\n') || '';
          return `- ${m.name}${m.description ? `: ${m.description}` : ''}${m.required ? ' (requerido)' : ''}\n${options}`;
        })
      ].filter(Boolean).join('\n');

      console.log('3. Generando embedding...');
      const embedding = await generateEmbedding(textForEmbedding);

      // Upsert en menu_item_embeddings
      const { error: upsertError } = await supabase
        .from('menu_item_embeddings')
        .upsert({
          item_id: item.id,
          embedding: embedding
        });

      if (upsertError) throw upsertError;
      console.log('✓ Embedding guardado');
    }

    console.log('\n¡Proceso completado con éxito!');
  } catch (error) {
    console.error('Error en el proceso:', error);
    process.exit(1);
  }
}

main(); 