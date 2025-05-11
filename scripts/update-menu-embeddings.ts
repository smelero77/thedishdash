import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ----- Debug logs -----
console.log('📂 Directorio actual:', process.cwd());
const envPath = resolve(process.cwd(), '.env.local');
console.log('🔍 Buscando .env.local en:', envPath);

// ----- Load environment -----
const result = config({ path: envPath });
console.log('📝 Resultado de carga .env.local:', result);

// ----- Interfaces -----
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  food_info?: string;
  origin?: string;
  price: number;
  profit_margin?: number;
  category_ids?: string[];
}
interface AllergenRow {
  allergen: {
    name: string;
  };
}
interface DietTagRow {
  diet_tag: {
    name: string;
  };
}
interface CategoryRow { name: string }

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
  console.error('❌ Faltan las siguientes variables de entorno:');
  missingEnvVars.forEach(key => console.error(`   - ${key}`));
  console.error('\nPor favor, crea un archivo .env.local en la raíz del proyecto con estas variables.');
  process.exit(1);
}

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const OPENAI_API_KEY    = process.env.OPENAI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai   = new OpenAI({ apiKey: OPENAI_API_KEY });

// ----- System Prompt for enrichment -----
const enrichmentPrompt = `
Eres un chef narrador. Cuando te proporcione la información completa de un plato, genera:
1) Una descripción atractiva combinando todos los elementos.
2) Una sugerencia de maridaje.

IMPORTANTE: Debes devolver SOLO un objeto JSON válido con exactamente estas dos propiedades:
{
  "full_description": "tu descripción aquí",
  "pairing_suggestion": "tu sugerencia de maridaje aquí"
}

No incluyas ningún otro texto, solo el JSON.`;

// ----- Embedding model -----
const EMBEDDING_MODEL = 'text-embedding-ada-002';

async function generateEmbedding(text: string): Promise<number[]> {
  const resp = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return resp.data[0].embedding;
}

async function main() {
  console.log('🔄 Starting enrichment + embedding process...');

  // 1) Fetch all menu items
  const { data: items, error: menuErr } = await supabase
    .from('menu_items')
    .select('id, name, description, food_info, origin, price, profit_margin, category_ids')
    .returns<MenuItem[]>();
  if (menuErr) throw menuErr;

  for (const item of items || []) {
    console.log(`\n🛠 Processing item: ${item.name}`);

    // 2) Fetch allergens and diet tags
    const { data: allergenRows } = await supabase
      .from('menu_item_allergens')
      .select(`
        allergen:allergens (
          name
        )
      `)
      .eq('menu_item_id', item.id)
      .returns<AllergenRow[]>();
    const allergenNames = allergenRows?.map(r => r.allergen.name) || [];

    const { data: dietRows } = await supabase
      .from('menu_item_diet_tags')
      .select(`
        diet_tag:diet_tags (
          name
        )
      `)
      .eq('menu_item_id', item.id)
      .returns<DietTagRow[]>();
    const dietNames = dietRows?.map(r => r.diet_tag.name) || [];

    // 3) Fetch category names
    const categoryIds = item.category_ids || [];
    let categoryNames: string[] = [];
    if (categoryIds.length) {
      const { data: catData } = await supabase
        .from('categories')
        .select('name')
        .in('id', categoryIds)
        .returns<CategoryRow[]>();
      categoryNames = catData?.map(c => c.name) || [];
    }

    // 4) Build full context for GPT
    const fullContext = {
      id: item.id,
      name: item.name,
      price: item.price,
      profit_margin: item.profit_margin ?? 0,
      description: item.description ?? '',
      food_info: item.food_info ?? '',
      origin: item.origin ?? '',
      allergens: allergenNames,
      dietTags: dietNames,
      categories: categoryNames
    };

    console.log('\n📋 Contexto completo para GPT:');
    console.log(JSON.stringify(fullContext, null, 2));

    console.log('\n🤖 Enriching with GPT...');
    const chatResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: enrichmentPrompt },
        { role: 'user', content: JSON.stringify(fullContext) }
      ],
      temperature: 0.5,
      max_tokens: 200
    });
    
    // Log raw response for debugging
    console.log('\n📝 Raw GPT response:');
    console.log(chatResp.choices[0].message?.content);
    
    let enriched;
    try {
      enriched = JSON.parse(chatResp.choices[0].message!.content!);
    } catch (error) {
      console.error('❌ Error parsing GPT response:', error);
      console.error('Raw content:', chatResp.choices[0].message?.content);
      // Fallback to basic description if JSON parsing fails
      enriched = {
        full_description: item.description || `Deliciosa ${item.name} elaborada con ingredientes de calidad.`,
        pairing_suggestion: 'Perfecta para acompañar con tu bebida favorita.'
      };
    }
    
    console.log('🔍 Enriched output:', enriched);
    const { full_description, pairing_suggestion } = enriched;

    // 5) Prepare text for embedding (include all relevant data)
    const embeddingText = [
      `Nombre: ${item.name}`,
      `Descripción: ${item.description ?? full_description}`,
      `Precio: ${item.price}€`,
      `Margen: ${item.profit_margin ?? 0}`,
      `Origen: ${item.origin}`,
      `Maridaje: ${pairing_suggestion}`,
      allergenNames.length ? `Alérgenos: ${allergenNames.join(', ')}` : '',
      dietNames.length    ? `DietTags: ${dietNames.join(', ')}` : '',
      categoryNames.length? `Categorías: ${categoryNames.join(', ')}` : ''
    ].filter(Boolean).join('. ');

    console.log('📦 Generating embedding...');
    const embedding = await generateEmbedding(embeddingText);

    // 6) Upsert embedding into menu_item_embeddings
    console.log('💾 Saving embedding...');
    const { error: embErr } = await supabase
      .from('menu_item_embeddings')
      .upsert({ item_id: item.id, embedding, text: embeddingText }, { onConflict: 'item_id' });
    if (embErr) console.error('❌ Failed to upsert embedding:', embErr.message);
    else console.log('✅ Embedding saved.');
  }

  console.log('\n🎉 All items processed!');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
}); 