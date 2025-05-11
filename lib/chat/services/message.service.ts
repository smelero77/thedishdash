import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { OpenAIEmbeddingService } from '@/lib/embeddings/services/openai.service';
import { CHAT_CONFIG } from '../constants/config';
import { recommendDishesFn, getProductDetailsFn } from '../constants/functions';
import { AssistantResponse } from '../types/response.types';
import { MenuItem } from '@/lib/types/menu';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class ChatMessageService {
  private supabase: SupabaseClient;
  private openai: OpenAI;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiApiKey: string,
    private embeddingService: OpenAIEmbeddingService
  ) {
    this.supabase = new SupabaseClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  async processMessage(
    sessionId: string,
    userAlias: string,
    userMessage: string,
    categoryId?: string
  ): Promise<AssistantResponse> {
    // 3.1 Validación mínima
    if (userMessage.trim().length < 3) {
      throw new Error("Escribe algo más descriptivo, por favor.");
    }

    // 3.2 Contexto breve del carrito
    const { data: cartItems } = await this.supabase
      .from("cart_items")
      .select("product_id, quantity, name")
      .eq("user_alias", userAlias);
    const cartContext = (!cartItems || cartItems.length === 0)
      ? "Tu carrito está vacío."
      : "En tu carrito tienes:\n" +
        cartItems.map((i: { name: string; quantity: number }) => `- ${i.name} x${i.quantity}`).join("\n");

    console.log('📦 Contexto del carrito:', cartContext);

    // 3.3 Búsqueda semántica previa
    const msgEmbedding = await this.embeddingService.getEmbedding(userMessage);
    const { data: similarItems } = await this.supabase.rpc("match_menu_items", {
      query_embedding: msgEmbedding,
      match_threshold: 0.5,
      match_count: 10
    })
    .eq("is_available", true);

    // 3.3.1 Obtener información de categorías
    const categoryMap: Record<string, string> = {};
    const catIds = Array.from(new Set(similarItems?.flatMap((i: MenuItem) => i.category_ids || []) || []));
    
    if (catIds.length) {
      const { data: cats } = await this.supabase
        .from('categories')
        .select('id, name')
        .in('id', catIds);
      
      cats?.forEach((c: { id: string; name: string }) => { categoryMap[c.id] = c.name; });
    }

    // 3.3.2 Enriquecer items con información de categorías
    const enrichedItems = similarItems?.map((i: MenuItem) => ({
      ...i,
      category_info: (i.category_ids || []).map((cid: string) => ({
        id: cid,
        name: categoryMap[cid] || '—'
      }))
    })) || [];

    // Filtrar por categoría si se especifica
    const filteredItems = categoryId 
      ? enrichedItems.filter((i: MenuItem) => i.category_ids?.includes(categoryId))
      : enrichedItems;

    // Excluir items ya en carrito
    const cartIds = new Set(cartItems?.map((i: { product_id: string }) => i.product_id));
    const candidates = filteredItems.filter((i: MenuItem) => !cartIds.has(i.id));

    // 3.4 Construcción de bloque con IDs
    const candidatesBlock = this.buildCandidatesBlock(candidates);
    console.log('🍽️ Candidatos disponibles:', candidatesBlock);

    // 3.5 Montaje de mensajes
    const messages: ChatCompletionMessageParam[] = [
      { 
        role: "system", 
        content: "Eres un asistente de restaurante especializado en recomendar platos y proporcionar información detallada sobre el menú." 
      },
      { 
        role: "system", 
        content: cartContext 
      },
      { 
        role: "system", 
        content: `Estos son los platos disponibles (excluyendo lo ya en tu carrito).  
Selecciona 2–3 y devuélveme un JSON con { id, name, price, reason, image_url, category_info }:

${candidatesBlock}` 
      },
      { 
        role: "user", 
        content: userMessage 
      }
    ];

    console.log('🤖 Mensajes enviados a GPT:', JSON.stringify(messages, null, 2));

    // 3.6 Llamada a GPT con function_call auto y DOS funciones
    const resp = await this.openai.chat.completions.create({
      model: CHAT_CONFIG.model,
      messages,
      functions: [recommendDishesFn, getProductDetailsFn],
      function_call: "auto",
      temperature: CHAT_CONFIG.temperature,
      max_tokens: CHAT_CONFIG.maxTokens,
      top_p: CHAT_CONFIG.topP,
      presence_penalty: CHAT_CONFIG.presencePenalty
    });

    console.log('📝 Respuesta de GPT:', JSON.stringify(resp.choices[0].message, null, 2));

    // 3.7 Guardar mensaje assistant
    await this.supabase.from("messages").insert({
      session_id: sessionId,
      sender: resp.choices[0].message.role,
      content: JSON.stringify(resp.choices[0].message)
    });

    // 3.8 Manejar función invocada
    return await this.handleAssistantMessage(resp.choices[0].message);
  }

  // Construye bloque textual de candidatos
  private buildCandidatesBlock(items: Array<MenuItem & { category_info: {id:string,name:string}[] }>): string {
    // Calcular score para cada item
    const scored = items.map(i => ({
      ...i,
      score: (i.profit_margin || 0) * 1.2 + (i.is_recommended ? 1 : 0)
    }));

    // Ordenar por score y tomar los top 5
    const top5 = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Generar texto formateado con IDs
    return top5
      .map(i => 
        `- id: **${i.id}**
  name: **${i.name}**
  price: **${i.price} €**
  description: ${i.description || '—'}
  image_url: ${i.image_url || '—'}
  categories:
    ${i.category_info.map(ci => `- id: ${ci.id}, name: ${ci.name}`).join('\n    ')}`
      )
      .join("\n\n");
  }

  // Manejo de respuestas function_call
  private async handleAssistantMessage(msg: any): Promise<AssistantResponse> {
    if (!msg.function_call) {
      console.log('📝 Respuesta de texto simple:', msg.content);
      return { type: "assistant_text", content: msg.content || "" };
    }

    try {
      console.log('🔍 Función invocada:', msg.function_call.name);
      console.log('📦 Argumentos:', msg.function_call.arguments);

      switch (msg.function_call.name) {
        case "recommend_dishes": {
          const { recommendations } = JSON.parse(msg.function_call.arguments) as {
            recommendations: Array<{
              id: string;
              name: string;
              price: number;
              reason: string;
              image_url: string;
              category_info: { id: string; name: string }[];
            }>;
          };

          console.log('🍽️ Recomendaciones:', JSON.stringify(recommendations, null, 2));

          if (!recommendations || !Array.isArray(recommendations)) {
            return {
              type: "assistant_text",
              content: "Lo siento, no pude generar recomendaciones adecuadas. ¿Podrías ser más específico?"
            };
          }

          return { type: "recommendations", data: recommendations };
        }

        case "get_product_details": {
          const { product_id } = JSON.parse(msg.function_call.arguments) as { product_id: string };
          console.log('🔍 Consultando detalles del producto:', product_id);

          // Consultar todos los campos en Supabase
          const { data: item, error } = await this.supabase
            .from('menu_items')
            .select('*')
            .eq('id', product_id)
            .single();

          if (error || !item) {
            console.error('❌ Error al obtener detalles:', error);
            return {
              type: "assistant_text",
              content: "Lo siento, no pude encontrar los detalles del plato. ¿Podrías intentarlo de nuevo?"
            };
          }

          // Obtener información de categorías
          const categoryMap: Record<string, string> = {};
          if (item.category_ids?.length) {
            const { data: cats } = await this.supabase
              .from('categories')
              .select('id, name')
              .in('id', item.category_ids);
            
            cats?.forEach((c: { id: string; name: string }) => { categoryMap[c.id] = c.name; });
          }

          // Enriquecer item con información de categorías
          const enrichedItem = {
            ...item,
            category_info: (item.category_ids || []).map((cid: string) => ({
              id: cid,
              name: categoryMap[cid] || '—'
            }))
          };

          console.log('📦 Item enriquecido:', JSON.stringify(enrichedItem, null, 2));

          // Generar texto explicativo con GPT
          const followupMessages: ChatCompletionMessageParam[] = [
            { 
              role: "system", 
              content: `Genera una ficha de producto y explicación clara. 
              Destaca los ingredientes principales, el origen si está disponible, 
              y cualquier nota especial del chef o sugerencia de maridaje.` 
            },
            { 
              role: "function", 
              name: "get_product_details", 
              content: JSON.stringify(enrichedItem) 
            }
          ];

          console.log('🤖 Mensajes para explicación:', JSON.stringify(followupMessages, null, 2));

          const followup = await this.openai.chat.completions.create({
            model: CHAT_CONFIG.model,
            messages: followupMessages,
            temperature: CHAT_CONFIG.temperature,
            max_tokens: 300
          });

          console.log('📝 Explicación generada:', followup.choices[0].message?.content);

          return {
            type: "product_details",
            data: {
              item: enrichedItem,
              explanation: followup.choices[0].message?.content || "No hay descripción disponible."
            }
          };
        }

        default:
          console.log('⚠️ Función no reconocida:', msg.function_call.name);
          return { 
            type: "assistant_text", 
            content: msg.content || "Lo siento, no pude procesar tu solicitud." 
          };
      }
    } catch (error) {
      console.error('❌ Error procesando respuesta del asistente:', error);
      return { 
        type: "assistant_text", 
        content: "Lo siento, hubo un error al procesar tu solicitud. ¿Podrías intentarlo de nuevo?" 
      };
    }
  }
} 