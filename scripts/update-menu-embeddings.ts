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
// Actualizada para reflejar tu tabla menu_items final
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
  is_available?: boolean;
  profit_margin?: number;
  category_ids?: string[]; // Array de UUIDs de categorías
  item_type: 'Comida' | 'Bebida'; // Ya lo tenías
  keywords?: string[];
  calories_est_min?: number;
  calories_est_max?: number;
  is_alcoholic?: boolean;
  drink_type?: string;
  drink_subtype?: string;
  drink_characteristics?: string[];
  drink_volume_ml?: number;
  drink_abv?: number; // En la BD es numeric(4,2)
  drink_brand?: string;
  wine_varietal?: string[];
  wine_region?: string;
  is_new_item?: boolean;
  is_seasonal?: boolean;
  is_vegetarian_base?: boolean;
  is_vegan_base?: boolean;
  is_gluten_free_base?: boolean;
}

interface AllergenRow {
  allergen: { // Nombre de la relación/alias en Supabase
    name: string;
    description?: string; 
  };
}

interface DietTagRow {
  diet_tag: { // Nombre de la relación/alias en Supabase
    name: string;
    description?: string;
  };
}

interface CategoryRow {
  id: string; 
  name: string;
  description?: string; // Opcional, si quieres usarla
}

interface SlotInfo { 
    name: string;
    description?: string;
    start_time?: string; // Opcional si no se usa en el embeddingText directamente
    end_time?: string;   // Opcional
}

interface SlotRow {
    slot: SlotInfo; // Nombre de la relación/alias en Supabase
}

// Validar variables de entorno (sin cambios)
// ... (tu código de validación de env vars)
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('❌ Faltan las siguientes variables de entorno:');
  missingEnvVars.forEach(key => console.error(`   - ${key}`));
  console.error('\nPor favor, crea un archivo .env.local en la raíz del proyecto con estas variables.');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// enrichmentPrompt (sin cambios, ya es bueno)
const enrichmentPrompt = `
Eres un experto culinario y sommelier para un restaurante moderno. Dada la información detallada de un plato o bebida, incluyendo sus ingredientes base, características, tipo, posibles maridajes existentes, y notas del chef, tu tarea es:
1.  Generar una "full_description": una descripción de marketing MUY atractiva, apetitosa y ligeramente más elaborada que la descripción base, integrando de forma natural sus atributos más destacables (ej. si es saludable, nuevo, casero, etc.). Máximo 80 palabras.
2.  Generar una "pairing_suggestion": una sugerencia de maridaje concisa y evocadora. Si el artículo es una bebida, sugiere con qué tipo de comida o situación iría bien. Si ya existe una sugerencia de maridaje base, puedes mejorarla o complementarla. Debe ser un tipo general de bebida o comida.

IMPORTANTE: Debes devolver SOLO un objeto JSON válido con exactamente estas dos propiedades:
{
  "full_description": "tu descripción aquí",
  "pairing_suggestion": "tu sugerencia de maridaje o de comida de acompañamiento aquí"
}

No incluyas ningún otro texto, solo el JSON. Asegúrate de que el JSON sea sintácticamente correcto.
`;

const EMBEDDING_MODEL = 'text-embedding-ada-002';

async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const truncatedText = cleanText.substring(0, 25000); // Truncado preventivo, API maneja 8191 tokens
  const resp = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: truncatedText });
  return resp.data[0].embedding;
}

async function main() {
  console.log('🔄 Starting enrichment + embedding process (vFinal)...');

  // 1) Fetch all menu items con TODOS los campos nuevos
  const { data: items, error: menuErr } = await supabase
    .from('menu_items')
    .select(`
      id, name, description, price, image_url, food_info, origin, 
      pairing_suggestion, chef_notes, is_recommended, is_available, 
      profit_margin, category_ids, 
      item_type, keywords, calories_est_min, calories_est_max, 
      is_alcoholic, drink_type, drink_subtype, drink_characteristics, 
      drink_volume_ml, drink_abv, drink_brand, wine_varietal, wine_region,
      is_new_item, is_seasonal, is_vegetarian_base, is_vegan_base, is_gluten_free_base
    `)
    // .eq('id', '2244181c-e8e8-4b81-b0dc-0cd2a7e024a6') // Para probar con un solo item como "Tostadas con salmón..."
    .returns<MenuItem[]>();

  if (menuErr) {
    console.error('❌ Error fetching menu items:', menuErr);
    throw menuErr;
  }
  if (!items || items.length === 0) {
    console.log('🤷 No menu items found to process.');
    return;
  }

  for (const item of items) {
    console.log(`\n🛠 Processing item: ${item.name} (ID: ${item.id})`);

    // 2) Fetch related data: Allergens, Diet Tags, Categories, Slots
    const { data: allergenRows } = await supabase
      .from('menu_item_allergens')
      .select(`allergen:allergens!inner (name)`) // Usar !inner para asegurar que la relación existe y allergen no es null
      .eq('menu_item_id', item.id)
      .returns<AllergenRow[]>();
    const allergenNames = allergenRows?.map(r => r.allergen.name).filter(Boolean) || [];

    const { data: dietRows } = await supabase
      .from('menu_item_diet_tags')
      .select(`diet_tag:diet_tags!inner (name)`) // Usar !inner
      .eq('menu_item_id', item.id)
      .returns<DietTagRow[]>();
    const dietNames = dietRows?.map(r => r.diet_tag.name).filter(Boolean) || [];

    let categoryData: CategoryRow[] = [];
    if (item.category_ids && item.category_ids.length > 0) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name') // Solo name es necesario para el embedding text, pero puedes traer description si la usas
        .in('id', item.category_ids)
        .returns<CategoryRow[]>();
      categoryData = catData || [];
    }
    const categoryNames = categoryData.map(c => c.name);

    // NUEVO: Fetch Slot details directamente del item
    const { data: slotRows } = await supabase
        .from('slot_menu_items')
        .select(`slot:slots!inner (name, description)`) // Usar !inner
        .eq('menu_item_id', item.id)
        .returns<SlotRow[]>();
    const slotDetails: SlotInfo[] = slotRows?.map(r => r.slot).filter(s => s !== null) as SlotInfo[] || [];
    const slotNames = slotDetails.map(s => s.name);


    // 3) Build full context for GPT enrichment
    const fullContext = {
      id: item.id,
      name: item.name,
      description_base: item.description ?? '',
      food_info_detallado: item.food_info ?? '',
      origin: item.origin ?? '',
      price: item.price,
      current_pairing_suggestion: item.pairing_suggestion ?? '',
      chef_notes: item.chef_notes ?? '',
      is_recommended: item.is_recommended,
      categories: categoryNames,
      allergens_presentes: allergenNames,
      diet_tags_aplicables: dietNames,
      slots_disponibles: slotNames,
      item_type: item.item_type,
      keywords_articulo: item.keywords ?? [],
      calories_range: (item.calories_est_min && item.calories_est_max) 
                      ? `${item.calories_est_min}-${item.calories_est_max} kcal (estimadas)` 
                      : (item.calories_est_max ? `hasta ${item.calories_est_max} kcal (estimadas)` : 'Calorías no especificadas'),
      is_new: item.is_new_item,
      is_seasonal: item.is_seasonal,
      is_vegetarian_base: item.is_vegetarian_base,
      is_vegan_base: item.is_vegan_base,
      is_gluten_free_base: item.is_gluten_free_base,
      ...(item.item_type === 'Bebida' && { // Solo añade estos campos si es una bebida
        is_alcoholic: item.is_alcoholic,
        drink_type: item.drink_type ?? '',
        drink_subtype: item.drink_subtype ?? '',
        drink_characteristics: item.drink_characteristics ?? [],
        drink_brand: item.drink_brand ?? '',
        drink_volume_ml: item.drink_volume_ml,
        drink_abv: item.drink_abv,
        wine_varietal: item.wine_varietal ?? [],
        wine_region: item.wine_region ?? '',
      })
    };
    // console.log('\n📋 Contexto completo para GPT (vFinal):', JSON.stringify(fullContext, null, 2));


    // 4) GPT Enrichment (sin cambios en la lógica, pero con contexto más rico)
    console.log('\n🤖 Enriqueciendo con GPT...');
    let enriched;
    try {
        const chatResp = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: enrichmentPrompt },
                { role: 'user', content: JSON.stringify(fullContext) }
            ],
            temperature: 0.6, 
            max_tokens: 350, // Un poco más de espacio si es necesario
            response_format: { type: "json_object" },
        });
        const rawContent = chatResp.choices[0].message?.content;
        // console.log('\n📝 Respuesta cruda de GPT:', rawContent);
        if (rawContent) {
            enriched = JSON.parse(rawContent);
        } else { throw new Error("Respuesta de GPT vacía o nula."); }
    } catch (error: any) {
      console.error(`❌ Error con GPT para item ${item.name} (ID: ${item.id}):`, error.message);
      // Fallback si GPT falla
      enriched = {
        full_description: item.description || `Una excelente opción: ${item.name}. Revisa sus detalles.`,
        pairing_suggestion: item.pairing_suggestion || 'Combina bien con muchas opciones de nuestra carta.'
      };
    }
    // console.log('🔍 Salida enriquecida:', enriched);
    const { full_description, pairing_suggestion: gpt_pairing_suggestion } = enriched;


    // 5) Construir Tags Semánticos (actualizado)
    const semanticTags = [
      ...(item.keywords?.map(k => `kw_${k.replace(/\s+/g, '_').toLowerCase()}`) || []),
      ...allergenNames.map(a => `alérgeno_${a.replace(/\s+/g, '_').toLowerCase()}`),
      ...dietNames.map(d => `dieta_${d.replace(/\s+/g, '_').toLowerCase()}`),
      ...categoryNames.map(c => `cat_${c.replace(/\s+/g, '_').toLowerCase()}`),
      ...slotNames.map(s => `slot_${s.replace(/\s+/g, '_').toLowerCase()}`), // Usar slotNames de la BD
      `tipo_${item.item_type.toLowerCase()}`,
    ];
    if (item.item_type === 'Bebida') {
        if (item.is_alcoholic !== undefined) semanticTags.push(item.is_alcoholic ? 'bebida_alcohólica' : 'bebida_no_alcohólica');
        if (item.drink_type) semanticTags.push(`bebida_tipo_${item.drink_type.replace(/\s+/g, '_').toLowerCase()}`);
        if (item.drink_subtype) semanticTags.push(`bebida_subtipo_${item.drink_subtype.replace(/\s+/g, '_').toLowerCase()}`);
        if(item.drink_characteristics && item.drink_characteristics.length > 0) {
            item.drink_characteristics.forEach(char => semanticTags.push(`bebida_caracteristica_${char.replace(/\s+/g, '_').toLowerCase()}`));
        }
    }
    if (item.is_new_item) semanticTags.push('item_nuevo');
    if (item.is_seasonal) semanticTags.push('item_de_temporada');
    if (item.is_vegetarian_base) semanticTags.push('base_vegetariana');
    if (item.is_vegan_base) semanticTags.push('base_vegana');
    if (item.is_gluten_free_base) semanticTags.push('base_sin_gluten');
    if (item.is_recommended) semanticTags.push('recomendado_chef');


    // 6) Generate comprehensive embedding text (actualizado)
    const embeddingTextParts = [
      `Nombre: ${item.name}`,
      `Tipo: ${item.item_type}`,
      item.description ? `Descripción corta: ${item.description.trim()}` : '',
      full_description ? `Descripción (IA): ${full_description.trim()}`: '',
      item.food_info ? `Info detallada: ${item.food_info.trim()}` : '', // Tu descripción manual detallada
      `Precio: ${item.price}€`,
      item.origin ? `Origen: ${item.origin.trim()}` : '',
      // Usar la sugerencia de maridaje de GPT, o la original si la de GPT falla o no existe
      gpt_pairing_suggestion ? `Maridaje (IA): ${gpt_pairing_suggestion.trim()}` : (item.pairing_suggestion ? `Maridaje: ${item.pairing_suggestion.trim()}`: ''),
      item.chef_notes ? `Notas del Chef: ${item.chef_notes.trim()}` : '',
      item.is_recommended ? `Recomendado por la casa.` : '',
      categoryNames.length > 0 ? `Categorías: ${categoryNames.join(', ')}.` : '',
      allergenNames.length > 0 ? `Alérgenos: ${allergenNames.join(', ')}.` : 'Alérgenos base: No especificados.',
      dietNames.length > 0 ? `Etiquetas Dietéticas: ${dietNames.join(', ')}.` : '',
      item.keywords && item.keywords.length > 0 ? `Palabras Clave: ${item.keywords.join(', ')}.` : '',
      (item.calories_est_min && item.calories_est_max) ? `Calorías: ${item.calories_est_min} - ${item.calories_est_max} kcal (estimadas).` : (item.calories_est_max ? `Calorías: hasta ${item.calories_est_max} kcal (estimadas).` : ''),
      slotNames.length > 0 ? `Momentos de Consumo: ${slotNames.join('; ')}.` : '', // Nombres de slot directos
    ];

    if (item.item_type === 'Bebida') {
      if (item.is_alcoholic !== undefined) embeddingTextParts.push(`Alcohólica: ${item.is_alcoholic ? 'Sí' : 'No'}.`);
      if (item.drink_type) embeddingTextParts.push(`Tipo de bebida: ${item.drink_type}.`);
      if (item.drink_subtype) embeddingTextParts.push(`Subtipo: ${item.drink_subtype}.`);
      if (item.drink_characteristics && item.drink_characteristics.length > 0) embeddingTextParts.push(`Características: ${item.drink_characteristics.join(', ')}.`);
      if (item.drink_volume_ml) embeddingTextParts.push(`Volumen: ${item.drink_volume_ml}ml.`);
      if (item.drink_abv) embeddingTextParts.push(`ABV: ${item.drink_abv}%.`);
      if (item.drink_brand) embeddingTextParts.push(`Marca: ${item.drink_brand}.`);
      if (item.wine_varietal && item.wine_varietal.length > 0) embeddingTextParts.push(`Uva(s): ${item.wine_varietal.join(', ')}.`);
      if (item.wine_region) embeddingTextParts.push(`Región (Vino): ${item.wine_region}.`);
    }

    if (item.is_new_item) embeddingTextParts.push(`Novedad.`);
    if (item.is_seasonal) embeddingTextParts.push(`De temporada.`);
    if (item.is_vegetarian_base !== undefined) embeddingTextParts.push(`Base vegetariana: ${item.is_vegetarian_base ? 'Sí' : 'No'}.`);
    if (item.is_vegan_base !== undefined) embeddingTextParts.push(`Base vegana: ${item.is_vegan_base ? 'Sí' : 'No'}.`);
    if (item.is_gluten_free_base !== undefined) embeddingTextParts.push(`Base sin gluten: ${item.is_gluten_free_base ? 'Sí' : 'No'}.`);
    
    embeddingTextParts.push(`Tags: ${semanticTags.join('; ')}.`);

    const embeddingText = embeddingTextParts.filter(part => part && part.trim() !== '').join(' ').replace(/\s+/g, ' ').trim();


    console.log('\n📝 Texto para embedding (vFinal):');
    console.log(embeddingText);

    console.log('📦 Generando embedding (vFinal)...');
    const embedding = await generateEmbedding(embeddingText);

    // 7) Upsert embedding
    console.log('💾 Guardando embedding (vFinal)...');
    const { error: embErr } = await supabase
      .from('menu_item_embeddings')
      .upsert({ item_id: item.id, embedding, text: embeddingText }, { onConflict: 'item_id' });
    
    if (embErr) console.error('❌ Error al guardar embedding:', embErr.message);
    else console.log('✅ Embedding guardado.');
    
    // Pausa para evitar rate limiting si procesas muchos items
    // await new Promise(resolve => setTimeout(resolve, 200)); 
  }

  console.log('\n🎉 Todos los items procesados (vFinal)!');
}

main().catch(err => {
  console.error('Error fatal en main (vFinal):', err);
  process.exit(1);
});