import { OpenAI } from 'openai';
import { OpenAIEmbeddingService } from '@/lib/embeddings/services/openai.service';
import { CHAT_CONFIG } from '../constants/config';
import { recommendDishesFn, getProductDetailsFn, OPENAI_CONFIG } from '../constants/functions';
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
    this.openai = new OpenAI({ 
      apiKey: openaiApiKey
    });
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
    console.log('🚀 INICIO PROCESAMIENTO:', {
      sessionId,
      userAlias,
      userMessage,
      categoryId,
      timestamp: new Date().toISOString()
    });
    this.startTyping();
    
    try {
      // 3.1 Validación mínima
      if (userMessage.trim().length < 3) {
        console.log('❌ VALIDACIÓN FALLIDA:', {
          messageLength: userMessage.trim().length,
          message: userMessage
        });
        throw new Error("Escribe algo más descriptivo, por favor.");
      }

      // 3.2 Contexto breve del carrito
      console.log('🛒 CONSULTA CARRITO:', {
        alias: userAlias,
        timestamp: new Date().toISOString()
      });
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
        console.error('❌ ERROR CARRITO:', {
          error: cartError,
          alias: userAlias
        });
      }
      console.log('📦 RESULTADO CARRITO:', {
        items: cartItems,
        count: cartItems?.length || 0
      });

      const cartContext = (!cartItems || cartItems.length === 0)
        ? "Tu carrito está vacío."
        : "En tu carrito tienes:\n" +
          cartItems.map((i: any) => 
            `- ${i.menu_items.name} x${i.quantity}`
          ).join("\n");

      // 3.3 Búsqueda semántica
      console.log('🔍 INICIO BÚSQUEDA SEMÁNTICA:', {
        query: userMessage,
        timestamp: new Date().toISOString()
      });
      const msgEmbedding = await this.embeddingService.getEmbedding(userMessage);
      console.log('📊 EMBEDDING GENERADO:', {
        dimensions: msgEmbedding.length,
        timestamp: new Date().toISOString()
      });

      // 1) Intento vectorial
      const rpcParams = {
        p_query_embedding: msgEmbedding,
        p_match_threshold: 0.3,
        p_match_count: 10
      };
      console.log('🎯 PARÁMETROS RPC match_menu_items:', {
        query_embedding_length: rpcParams.p_query_embedding.length,
        match_threshold: rpcParams.p_match_threshold,
        match_count: rpcParams.p_match_count,
        timestamp: new Date().toISOString()
      });

      let { data: similarItems, error: vecErr } = await supabase
        .rpc('match_menu_items', rpcParams);

      if (vecErr) {
        console.error('❌ ERROR EN BÚSQUEDA VECTORIAL:', {
          error: vecErr,
          params: rpcParams,
          timestamp: new Date().toISOString()
        });
      }

      console.log('🍽️ RESULTADOS VECTORIALES:', {
        count: similarItems?.length || 0,
        items: similarItems?.map((i: { name: string; similarity?: number; distance?: number }) => ({
          name: i.name,
          distance: i.similarity || i.distance
        })),
        timestamp: new Date().toISOString()
      });

      // 2) Fallback por keywords si no hay resultados
      if ((!similarItems || similarItems.length === 0) && userMessage.trim()) {
        console.log('⚠️ INICIO FALLBACK KEYWORDS:', {
          keyword: userMessage.toLowerCase(),
          timestamp: new Date().toISOString()
        });
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

        console.log('🔄 RESULTADOS FALLBACK:', {
          count: fallback?.length || 0,
          items: fallback?.map(f => f.menu_items),
          timestamp: new Date().toISOString()
        });
        similarItems = fallback?.map(f => f.menu_items) || [];
      }

      // 3.3.1 Obtener información de categorías
      const categoryMap: Record<string, string> = {};
      const catIds = Array.from(new Set(similarItems?.flatMap((i: MenuItem) => i.category_ids || []) || []));
      console.log('📑 CONSULTA CATEGORÍAS:', {
        categoryIds: catIds,
        timestamp: new Date().toISOString()
      });
      
      if (catIds.length) {
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', catIds);
        
        cats?.forEach((c: { id: string; name: string }) => { categoryMap[c.id] = c.name; });
        console.log('🏷️ MAPA CATEGORÍAS:', {
          categories: categoryMap,
          timestamp: new Date().toISOString()
        });
      }

      // 3.3.2 Enriquecer items con información de categorías
      const enrichedItems = similarItems?.map((i: MenuItem) => ({
        ...i,
        category_info: (i.category_ids || []).map((cid: string) => ({
          id: cid,
          name: categoryMap[cid] || '—'
        }))
      })) || [];

      console.log('✨ ITEMS ENRIQUECIDOS:', {
        count: enrichedItems.length,
        items: enrichedItems,
        timestamp: new Date().toISOString()
      });

      // Filtrar por categoría si se especifica
      const filteredItems = categoryId 
        ? enrichedItems.filter((i: MenuItem) => i.category_ids?.includes(categoryId))
        : enrichedItems;

      console.log('🔍 FILTRADO POR CATEGORÍA:', {
        categoryId,
        count: filteredItems.length,
        timestamp: new Date().toISOString()
      });

      // Excluir items ya en carrito
      const cartIds = new Set(cartItems?.map((i: any) => i.menu_item_id));
      console.log('🛒 FILTRADO CARRITO:', {
        cartIds: Array.from(cartIds),
        timestamp: new Date().toISOString()
      });
      
      let candidates = filteredItems.filter((i: MenuItem) => !cartIds.has(i.id));
      console.log('🎯 CANDIDATOS FINALES:', {
        count: candidates.length,
        items: candidates.map((i: MenuItem) => ({ id: i.id, name: i.name })),
        timestamp: new Date().toISOString()
      });

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
      console.log('📝 BLOQUE CANDIDATOS:', {
        block: candidatesBlock,
        timestamp: new Date().toISOString()
      });

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

      console.log('🤖 MENSAJES ENVIADOS A GPT:', {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        functions: [recommendDishesFn, getProductDetailsFn],
        config: {
          model: CHAT_CONFIG.recommendationModel,
          temperature: CHAT_CONFIG.temperature,
          maxTokens: CHAT_CONFIG.maxTokensRecommendation,
          topP: CHAT_CONFIG.topP,
          presencePenalty: CHAT_CONFIG.presencePenalty
        },
        timestamp: new Date().toISOString()
      });

      // 3.6 Llamada a GPT para recomendaciones
      const resp = await this.openai.chat.completions.create({
        model: CHAT_CONFIG.recommendationModel,  // gpt-4o-mini
        messages,
        functions: [recommendDishesFn, getProductDetailsFn],
        function_call: "auto",
        temperature: CHAT_CONFIG.temperature,    // 0.4
        max_tokens: CHAT_CONFIG.maxTokensRecommendation,
        top_p: CHAT_CONFIG.topP,
        presence_penalty: CHAT_CONFIG.presencePenalty
      });

      console.log('📝 RESPUESTA COMPLETA DE GPT:', {
        id: resp.id,
        model: resp.model,
        created: resp.created,
        choices: resp.choices.map(choice => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content,
            function_call: choice.message.function_call ? {
              name: choice.message.function_call.name,
              arguments: choice.message.function_call.arguments
            } : null
          },
          finish_reason: choice.finish_reason
        })),
        usage: {
          prompt_tokens: resp.usage?.prompt_tokens,
          completion_tokens: resp.usage?.completion_tokens,
          total_tokens: resp.usage?.total_tokens
        },
        timestamp: new Date().toISOString()
      });

      // 3.7 Guardar mensaje assistant
      console.log('💾 GUARDANDO RESPUESTA:', {
        sessionId,
        role: resp.choices[0].message.role,
        content: JSON.stringify(resp.choices[0].message),
        timestamp: new Date().toISOString()
      });
      await supabase.from("messages").insert({
        session_id: sessionId,
        sender: resp.choices[0].message.role,
        content: JSON.stringify(resp.choices[0].message)
      });

      // 3.8 Manejar función invocada
      console.log('🔄 PROCESANDO RESPUESTA:', {
        functionCall: resp.choices[0].message.function_call ? {
          name: resp.choices[0].message.function_call.name,
          arguments: resp.choices[0].message.function_call.arguments
        } : null,
        content: resp.choices[0].message.content,
        timestamp: new Date().toISOString()
      });
      const response = await this.handleAssistantMessage(resp.choices[0].message);
      console.log('✅ RESPUESTA PROCESADA:', {
        type: response.type,
        data: response,
        timestamp: new Date().toISOString()
      });
      this.stopTyping();
      return response;
    } catch (error) {
      console.error('❌ ERROR:', {
        error,
        sessionId,
        userAlias,
        timestamp: new Date().toISOString()
      });
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
            model: CHAT_CONFIG.productExplanationModel,
            messages: followupMessages,
            temperature: CHAT_CONFIG.productExplanationTemperature,
            max_tokens: CHAT_CONFIG.maxTokensProductExplanation
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