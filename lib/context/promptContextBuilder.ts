import { getPromptContextFromSupabase } from './getPromptContextFromSupabase';
import { supabase } from '../supabase';

export async function getAllergens(): Promise<string[]> {
  const { data, error } = await supabase.from('allergens').select('name');
  if (error) throw error;
  return data?.map((a) => a.name) || [];
}

export async function getDietTags(): Promise<string[]> {
  const { data, error } = await supabase.from('diet_tags').select('name');
  if (error) throw error;
  return data?.map((d) => d.name) || [];
}

export async function buildPromptContext() {
  const { categories, slots } = await getPromptContextFromSupabase();
  const allergens = await getAllergens();
  const dietTags = await getDietTags();

  // Relación slot-categoría
  const slotCategoria = slots.map((slot) => ({
    name: slot.name,
    start_time: slot.start_time,
    end_time: slot.end_time,
    categorias: slot.categories?.map((c) => c.name) || [],
  }));

  // Relación categoría-slot (opcional, si prefieres por categoría)
  const categoriaSlot = categories.map((cat) => ({
    name: cat.name,
    slots: slots
      .filter((slot) => slot.categories?.some((c) => c.name === cat.name))
      .map((s) => s.name),
  }));

  return {
    categorias: categories.map((c) => c.name),
    slots: slots.map((s) => ({
      name: s.name,
      start_time: s.start_time,
      end_time: s.end_time,
    })),
    slotCategoria,
    categoriaSlot,
    alergenos: allergens,
    dietas: dietTags,
  };
}

export function buildSystemPrompt(context: Awaited<ReturnType<typeof buildPromptContext>>) {
  const categoriasPrompt = context.categorias.map((c) => `- ${c}`).join('\n');
  const slotsPrompt = context.slots
    .map((s) => `- ${s.name} (${s.start_time} - ${s.end_time})`)
    .join('\n');
  const alergenosPrompt = context.alergenos.map((a) => `- ${a}`).join('\n');
  const dietasPrompt = context.dietas.map((d) => `- ${d}`).join('\n');
  const slotCategoriaPrompt = context.slotCategoria
    .map((s) => `- ${s.name}: ${s.categorias.join(', ')}`)
    .join('\n');

  return `
Eres un asistente especializado en extraer información relevante de las consultas de los usuarios sobre comida y bebida. SOLO puedes usar los siguientes valores válidos:

CATEGORÍAS VÁLIDAS:
${categoriasPrompt}

SLOTS VÁLIDOS:
${slotsPrompt}

RELACIÓN SLOT-CATEGORÍA:
${slotCategoriaPrompt}

ALÉRGENOS VÁLIDOS:
${alergenosPrompt}

ETIQUETAS DIETÉTICAS VÁLIDAS:
${dietasPrompt}

Cuando extraigas filtros, asegúrate de que SOLO usas valores de estas listas. Si el usuario menciona algo que no está, ignóralo o intenta mapearlo a lo más parecido de la lista.
`.trim();
}
