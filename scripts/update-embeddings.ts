import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Verificar variables de entorno
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

async function getItemDetails(itemId: string) {
  // Obtener categorías
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('name')
    .in('id', (await supabase
      .from('menu_items')
      .select('category_ids')
      .eq('id', itemId)
      .single()
    ).data?.category_ids || []);

  if (categoriesError) throw categoriesError;

  // Obtener slots
  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .select('name')
    .in('id', (await supabase
      .from('slot_menu_items')
      .select('slot_id')
      .eq('menu_item_id', itemId)
    ).data?.map(s => s.slot_id) || []);

  if (slotsError) throw slotsError;

  // Obtener alérgenos
  const { data: allergens, error: allergensError } = await supabase
    .from('allergens')
    .select('name')
    .in('id', (await supabase
      .from('menu_item_allergens')
      .select('allergen_id')
      .eq('menu_item_id', itemId)
    ).data?.map(a => a.allergen_id) || []);

  if (allergensError) throw allergensError;

  // Obtener tags dietéticos
  const { data: dietTags, error: dietTagsError } = await supabase
    .from('diet_tags')
    .select('name')
    .in('id', (await supabase
      .from('menu_item_diet_tags')
      .select('diet_tag_id')
      .eq('menu_item_id', itemId)
    ).data?.map(t => t.diet_tag_id) || []);

  if (dietTagsError) throw dietTagsError;

  return {
    categories: categories?.map(c => c.name) || [],
    slots: slots?.map(s => s.name) || [],
    allergens: allergens?.map(a => a.name) || [],
    dietTags: dietTags?.map(t => t.name) || []
  };
}

async function main() {
  try {
    // 1. Obtener todos los items del menú
    const { data: menuItems, error: fetchError } = await supabase
      .from('menu_items')
      .select('*');

    if (fetchError) throw fetchError;
    if (!menuItems?.length) {
      console.log('No hay items en el menú para procesar');
      return;
    }

    console.log(`Procesando ${menuItems.length} items...`);

    // 2. Procesar cada item
    for (const item of menuItems) {
      console.log(`\nProcesando item: ${item.name}`);
      
      // Obtener detalles adicionales
      const details = await getItemDetails(item.id);
      
      // Construir el texto para el embedding
      const itemText = [
        `Nombre: ${item.name}`,
        `Descripción: ${item.description || 'Sin descripción'}`,
        `Precio: ${item.price}€`,
        `Información nutricional: ${item.food_info || 'No disponible'}`,
        `Origen: ${item.origin || 'No especificado'}`,
        `Sugerencia de maridaje: ${item.pairing_suggestion || 'No disponible'}`,
        `Notas del chef: ${item.chef_notes || 'No disponible'}`,
        `Recomendado: ${item.is_recommended ? 'Sí' : 'No'}`,
        `Disponible: ${item.is_available ? 'Sí' : 'No'}`,
        `Margen de beneficio: ${item.profit_margin ? item.profit_margin + '%' : 'No especificado'}`,
        `Categorías: ${details.categories.join(', ') || 'Sin categorías'}`,
        `Slots disponibles: ${details.slots.join(', ') || 'Sin slots'}`,
        `Alérgenos: ${details.allergens.join(', ') || 'Sin alérgenos'}`,
        `Restricciones dietéticas: ${details.dietTags.join(', ') || 'Sin restricciones'}`
      ].join('\n');

      console.log('Texto generado para embedding:');
      console.log(itemText);
      
      // Generar embedding
      const embedding = await generateEmbedding(itemText);

      // Guardar en la base de datos
      const { error: saveError } = await supabase
        .from('menu_item_embeddings')
        .upsert({
          item_id: item.id,
          embedding: embedding,
          text: itemText
        });

      if (saveError) throw saveError;
      console.log('Embedding guardado exitosamente');
    }

    console.log('\n¡Proceso completado!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 