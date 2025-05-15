import { OpenAI } from 'openai';
import { OpenAIEmbeddingService } from '@/lib/embeddings/services/openai.service';
import { CHAT_CONFIG } from '../constants/config';
import { recommendDishesFn, getProductDetailsFn } from '../constants/functions';
import { AssistantResponse } from '../types/response.types';
import { MenuItem } from '@/lib/types/menu';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { supabase } from '@/lib/supabase';

export class ChatMessageService {
  private openai: OpenAI;
  private isTyping: boolean = false;
  private typingInterval: NodeJS.Timeout | null = null;

  constructor(
    openaiApiKey: string,
    private embeddingService: OpenAIEmbeddingService
  ) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  private startTyping(): void {
    this.isTyping = true;
    this.typingInterval = setInterval(() => {
      if (this.isTyping) {
        console.log('⌨️ El asistente está escribiendo...');
      }
    }, 1000);
  }

  private stopTyping(): void {
    this.isTyping = false;
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
  }

  async processMessage(
    sessionId: string,
    userAlias: string,
    userMessage: string,
    categoryId?: string
  ): Promise<AssistantResponse> {
    this.startTyping();
    
    try {
      // 3.1 Validación mínima
      if (userMessage.trim().length < 3) {
        throw new Error("Escribe algo más descriptivo, por favor.");
      }

      // 3.2 Contexto breve del carrito
      console.log('👤 User alias:', userAlias);
      const { data: cartItems, error: cartError } = await supabase
        .from("temporary_order_items")
        .select(`
          menu_item_id,
          quantity,
          menu_items!inner (
            name
          )
        `)
        .eq("alias", userAlias);
      
      if (cartError) {
        console.error('❌ Error obteniendo items del carrito:', cartError);
      }
      console.log('🛒 Items en carrito:', cartItems);

      const cartContext = (!cartItems || cartItems.length === 0)
        ? "Tu carrito está vacío."
        : "En tu carrito tienes:\n" +
          cartItems.map((i: any) => 
            `- ${i.menu_items.name} x${i.quantity}`
          ).join("\n");

      console.log('📦 Contexto del carrito:', cartContext);

      // 3.3 Búsqueda semántica
      console.log('\n🔍 Iniciando búsqueda semántica para:', userMessage);
      const msgEmbedding = await this.embeddingService.getEmbedding(userMessage);
      console.log('📊 Embedding generado:', msgEmbedding.length, 'dimensiones');

      // 1) Intento vectorial
      let { data: similarItems, error: vecErr } = await supabase
        .rpc('match_menu_items', {
          query_embedding: msgEmbedding,
          match_threshold: 0.3,
          match_count: 10
        })
        .eq('is_available', true);

      console.log('🍽️ Items similares encontrados:', similarItems?.length || 0);
      console.log('🔍 Semántica:', similarItems?.map((i: { name: string; similarity?: number; distance?: number }) => ({
        name: i.name,
        distance: i.similarity || i.distance
      })));

      // 2) Fallback por keywords si no hay resultados
      if ((!similarItems || similarItems.length === 0) && userMessage.trim()) {
        console.log('⚠️ No hay resultados vectoriales, intentando fallback por texto...');
        const keyword = userMessage.toLowerCase();
        const { data: fallback } = await supabase
          .from('menu_item_embeddings')
          .select(`
            menu_items!inner (
              id,
              name,
              description,
              price,
              image_url,
              category_ids
            )
          `)
          .ilike('text', `%${keyword}%`)
          .eq('menu_items.is_available', true)
          .limit(10);

        console.log('🔄 Results fallback:', fallback?.length || 0);
        similarItems = fallback?.map(f => f.menu_items) || [];
      }

      // 3.3.1 Obtener información de categorías
      const categoryMap: Record<string, string> = {};
      const catIds = Array.from(new Set(similarItems?.flatMap((i: MenuItem) => i.category_ids || []) || []));
      console.log('📑 IDs de categorías encontrados:', catIds);
      
      if (catIds.length) {
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', catIds);
        
        cats?.forEach((c: { id: string; name: string }) => { categoryMap[c.id] = c.name; });
        console.log('🏷️ Mapa de categorías:', categoryMap);
      }

      // 3.3.2 Enriquecer items con información de categorías
      const enrichedItems = similarItems?.map((i: MenuItem) => ({
        ...i,
        category_info: (i.category_ids || []).map((cid: string) => ({
          id: cid,
          name: categoryMap[cid] || '—'
        }))
      })) || [];

      console.log('✨ Items enriquecidos:', JSON.stringify(enrichedItems, null, 2));

      // Filtrar por categoría si se especifica
      const filteredItems = categoryId 
        ? enrichedItems.filter((i: MenuItem) => i.category_ids?.includes(categoryId))
        : enrichedItems;

      console.log('🔍 Items después de filtrar por categoría:', filteredItems.length);
      if (categoryId) {
        console.log('📑 Filtrando por categoría ID:', categoryId);
      }

      // Excluir items ya en carrito
      const cartIds = new Set(cartItems?.map((i: any) => i.menu_item_id));
      console.log('🛒 IDs en carrito:', Array.from(cartIds));
      console.log('🔍 Items antes de filtrar carrito:', filteredItems.map((i: MenuItem) => ({ id: i.id, name: i.name })));
      
      let candidates = filteredItems.filter((i: MenuItem) => !cartIds.has(i.id));
      console.log('🎯 Candidatos finales:', candidates.map((i: MenuItem) => ({ id: i.id, name: i.name })));

      // Fallback explícito por categoría si no hay candidatos
      if (candidates.length === 0) {
        console.log('⚠️ No hay candidatos, intentando fallback por categoría...');
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', '%desayuno%')
          .single();

        if (cat) {
          console.log('📑 Categoría Desayuno encontrada:', cat.id);
          const { data: catItems } = await supabase
            .from('menu_items')
            .select(`
              id,
              name,
              description,
              price,
              image_url,
              profit_margin,
              category_ids,
              food_info,
              origin,
              pairing_suggestion,
              chef_notes,
              is_recommended
            `)
            .contains('category_ids', [cat.id])
            .eq('is_available', true)
            .order('profit_margin', { ascending: false })
            .limit(5);

          if (catItems && catItems.length > 0) {
            console.log('🍽️ Items de desayuno encontrados:', catItems.length);
            console.log('📋 Items de desayuno:', catItems.map(i => ({ id: i.id, name: i.name, profit_margin: i.profit_margin })));
            
            // Enriquecer los items con la información de categorías
            const enrichedCatItems = catItems.map(item => ({
              ...item,
              category_info: [{
                id: cat.id,
                name: 'Desayuno'
              }]
            }));
            
            candidates = enrichedCatItems;
          } else {
            console.log('❌ No se encontraron items en la categoría Desayuno');
          }
        } else {
          console.log('❌ No se encontró la categoría Desayuno');
        }
      }

      // Si aún no hay candidatos después de todos los fallbacks, devolver mensaje al usuario
      if (candidates.length === 0) {
        console.log('⚠️ No hay resultados después de todos los fallbacks');
        return {
          type: "assistant_text",
          content: "Lo siento, no he encontrado platos que coincidan con tu búsqueda. ¿Podrías intentar con otras palabras o ser más específico?"
        };
      }

      // 3.4 Construcción de bloque con IDs
      const candidatesBlock = this.buildCandidatesBlock(candidates);
      console.log('\n📝 Bloque de candidatos construido:');
      console.log(candidatesBlock);

      // 3.5 Montaje de mensajes
      const messages: ChatCompletionMessageParam[] = [
        { 
          role: "system", 
          content: "Eres un asistente de restaurante especializado en recomendar platos y proporcionar información detallada sobre el menú. IMPORTANTE: Asegúrate de que las URLs de las imágenes estén completas y no truncadas. Si una URL es muy larga, usa una versión más corta pero completa."
        },
        { 
          role: "system", 
          content: cartContext 
        },
        { 
          role: "system", 
          content: `Estos son los platos disponibles (excluyendo lo ya en tu carrito).  
Selecciona 2–3 y devuélveme un JSON con { id, name, price, reason, image_url, category_info }.
IMPORTANTE: Asegúrate de que el JSON sea válido y que las URLs de las imágenes estén completas.

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
        max_tokens: 1000,
        top_p: CHAT_CONFIG.topP,
        presence_penalty: CHAT_CONFIG.presencePenalty
      });

      console.log('📝 Respuesta de GPT:', JSON.stringify(resp.choices[0].message, null, 2));

      // 3.7 Guardar mensaje assistant
      await supabase.from("messages").insert({
        session_id: sessionId,
        sender: resp.choices[0].message.role,
        content: JSON.stringify(resp.choices[0].message)
      });

      // 3.8 Manejar función invocada
      const response = await this.handleAssistantMessage(resp.choices[0].message);
      this.stopTyping();
      return response;
    } catch (error) {
      this.stopTyping();
      throw error;
    }
  }

  // Construye bloque textual de candidatos
  private buildCandidatesBlock(items: Array<MenuItem & { category_info: {id:string,name:string}[] }>): string {
    // Calcular score para cada item
    const scored = items.map(i => ({
      ...i,
      score: (i.profit_margin || 0) * 1.2 + (i.is_recommended ? 1 : 0)
    }));

    // Ordenar por score y tomar los top 3
    const top3 = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Generar texto formateado con IDs
    return top3
      .map(i => 
        `- id: **${i.id}**
  name: **${i.name}**
  price: **${i.price} €**
  description: ${i.description || '—'}
  image_url: ${i.image_url ? i.image_url.split('/').pop() || '—' : '—'}
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
          let recommendations;
          try {
            const parsedArgs = JSON.parse(msg.function_call.arguments);
            recommendations = parsedArgs.recommendations;

            // Validar estructura de cada recomendación
            if (!Array.isArray(recommendations)) {
              throw new Error('Las recomendaciones deben ser un array');
            }

            // Validar y limpiar cada recomendación
            recommendations = recommendations.map(rec => ({
              id: rec.id,
              name: rec.name,
              price: Number(rec.price),
              reason: rec.reason,
              image_url: rec.image_url?.trim() || null,
              category_info: Array.isArray(rec.category_info) 
                ? rec.category_info.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name
                  }))
                : []
            }));

            console.log('🍽️ Recomendaciones procesadas:', JSON.stringify(recommendations, null, 2));

            if (!recommendations.length) {
              return {
                type: "assistant_text",
                content: "Lo siento, no pude generar recomendaciones adecuadas. ¿Podrías ser más específico?"
              };
            }

            return { type: "recommendations", data: recommendations };
          } catch (error) {
            console.error('❌ Error procesando recomendaciones:', error);
            console.error('📦 Argumentos recibidos:', msg.function_call.arguments);
            return {
              type: "assistant_text",
              content: "Lo siento, hubo un error al procesar las recomendaciones. ¿Podrías intentarlo de nuevo?"
            };
          }
        }

        case "get_product_details": {
          const { product_id } = JSON.parse(msg.function_call.arguments) as { product_id: string };
          console.log('🔍 Consultando detalles del producto:', product_id);

          // Consultar todos los campos en Supabase
          const { data: item, error } = await supabase
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
            const { data: cats } = await supabase
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