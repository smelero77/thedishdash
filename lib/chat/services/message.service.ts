import { OpenAI } from 'openai';
import { OpenAIEmbeddingService } from '@/lib/embeddings/services/openai.service';
import { CHAT_CONFIG } from '../constants/config';
import { recommendDishesFn, getProductDetailsFn, OPENAI_CONFIG } from '../constants/functions';
import { ChatResponse } from '../types/response.types';
import { MenuItem } from '@/lib/types/menu';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { supabase } from '@/lib/supabase';
import { chatSessionService } from './ChatSessionService';
import { AssistantMessageSchema, UserMessageSchema } from '../types/session.types';
import { v4 as uuidv4 } from 'uuid';

// Función auxiliar para validar UUIDs
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

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
    categoryId?: string,
    tableNumber?: number
  ): Promise<ChatResponse> {
    console.log('🚀 INICIO PROCESAMIENTO:', {
      sessionId,
      userAlias,
      userMessage,
      categoryId,
      tableNumber,
      timestamp: new Date().toISOString()
    });
    this.startTyping();
    
    try {
      // 3.1 Validación mínima
      if (userMessage.trim().length < 3) {
        // Verificar si hay un historial de conversación antes de rechazar mensajes cortos
        const conversationTurns = await chatSessionService.getLastConversationTurns(sessionId, 2);
        const hasConversationHistory = conversationTurns.length > 1;
        
        if (!hasConversationHistory) {
          console.log('❌ VALIDACIÓN FALLIDA:', {
            messageLength: userMessage.trim().length,
            message: userMessage,
            hasHistory: false
          });
          throw new Error("Escribe algo más descriptivo, por favor.");
        } else {
          console.log('ℹ️ MENSAJE CORTO ACEPTADO (hay historial):', {
            messageLength: userMessage.trim().length,
            message: userMessage,
            historyTurns: conversationTurns.length
          });
        }
      }

      // Verificar y crear sesión si no existe
      let currentSession = await chatSessionService.get(sessionId);
      if (!currentSession) {
        console.log('Sesión no encontrada en processMessage, creando nueva:', sessionId);
        const customerId = uuidv4();
        currentSession = await chatSessionService.create(
          tableNumber || 0,
          userAlias,
          {
            timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
            lastActive: new Date(),
            sessionDuration: 0
          },
          sessionId
        );
      }

      // Guardar mensaje del usuario en el historial
      try {
        await chatSessionService.addMessage(sessionId, {
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error al guardar mensaje del usuario:', error);
        // Continuamos con el procesamiento aunque falle el guardado del mensaje
      }

      // 3.2 Contexto breve del carrito
      console.log('🛒 CONSULTA CARRITO:', {
        alias: userAlias,
        tableNumber: currentSession.table_number,
        timestamp: new Date().toISOString()
      });

      // Primero obtener el pedido temporal (cabecera) para la mesa del usuario
      const { data: temporaryOrder, error: temporaryOrderError } = await supabase
        .from("temporary_orders")
        .select("id")
        .eq("table_number", currentSession.table_number)
        .single();
      
      if (temporaryOrderError) {
        console.error('❌ ERROR AL OBTENER PEDIDO TEMPORAL:', {
          error: temporaryOrderError,
          tableNumber: currentSession.table_number,
          timestamp: new Date().toISOString()
        });
      }

      let cartItems: any[] = [];
      let cartError = null;

      if (temporaryOrder) {
        // Luego obtener los items relacionados con ese pedido temporal
        const result = await supabase
          .from("temporary_order_items")
          .select(`
            menu_item_id,
            quantity,
            menu_items!inner (
              name
            )
          `)
          .eq("temporary_order_id", temporaryOrder.id)
          .eq("alias", userAlias);
        
        cartItems = result.data || [];
        cartError = result.error;
      }
      
      if (cartError) {
        console.error('❌ ERROR CARRITO:', {
          error: cartError,
          alias: userAlias,
          temporaryOrderId: temporaryOrder?.id
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

      // Obtener items rechazados de la sesión
      if (currentSession?.rejected_items?.length) {
        const rejectedIds = new Set(currentSession.rejected_items);
        candidates = candidates.filter((i: MenuItem) => !rejectedIds.has(i.id));
        console.log('🚫 FILTRADO RECHAZADOS:', {
          rejectedIds: Array.from(rejectedIds),
          remainingCandidates: candidates.length,
          timestamp: new Date().toISOString()
        });
      }

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
              category_ids
            `)
            .eq('category_ids', cat.id)
            .eq('is_available', true)
            .limit(10);

          if (catItems?.length) {
            candidates = catItems.map((i: any) => ({
              ...i,
              category_info: [{ id: cat.id, name: 'Desayuno' }]
            }));
            console.log('🍳 CANDIDATOS FALLBACK:', {
              count: candidates.length,
              items: candidates.map((i: MenuItem) => ({ id: i.id, name: i.name })),
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      // Obtener últimos turnos de conversación para contexto
      const lastTurns = await chatSessionService.getLastConversationTurns(sessionId, 2);
      console.log('💬 ÚLTIMOS TURNOS:', {
        count: lastTurns.length,
        turns: lastTurns,
        timestamp: new Date().toISOString()
      });

      // Construir mensajes para GPT
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `Eres un asistente virtual de The Dish Dash, un restaurante moderno y acogedor. 
          Tu objetivo es ayudar a los clientes a encontrar platos que disfruten.
          ${cartContext}
          
          Contexto de la conversación reciente:
          ${lastTurns.map(turn => `${turn.role}: ${turn.content}`).join('\n')}
          
          IMPORTANTE: Solo puedes recomendar platos de esta lista exacta de candidatos disponibles:
          ${candidates.map((item: MenuItem & { category_info: {id:string,name:string}[] }) => `ID: ${item.id} - ${item.name}`).join('\n')}
          
          Instrucciones:
          1. Si el usuario pide recomendaciones o menciona "desayunar", SIEMPRE usa la función recommend_dishes.
          2. Si el usuario rechaza recomendaciones ("no me gustan estos", "dame otros"), evita sugerir los mismos platos.
          3. Mantén un tono amigable y profesional.
          4. Haz preguntas específicas para entender mejor las preferencias del usuario.
          5. Sugiere combinaciones de platos cuando sea apropiado.
          6. Menciona características especiales de los platos (ej. "sin gluten", "vegetariano").
          7. DEBES usar EXACTAMENTE los IDs proporcionados en la lista de candidatos. NO inventes IDs.`
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Llamar a GPT
      const completion = await this.openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages,
        functions: [recommendDishesFn, getProductDetailsFn],
        function_call: userMessage.toLowerCase().includes('desayunar') ? { name: 'recommend_dishes' } : 'auto',
        temperature: 0.5,
        max_tokens: 500
      });

      const response = completion.choices[0].message;
      console.log('🤖 RESPUESTA GPT:', {
        content: response.content,
        function_call: response.function_call,
        timestamp: new Date().toISOString()
      });

      // NO guardamos aquí directamente la respuesta cruda, sino que la procesamos primero
      
      // Si es una recomendación, guardar los IDs recomendados
      if (response.function_call?.name === 'recommend_dishes') {
        const args = JSON.parse(response.function_call.arguments);
        const recommendedIds = args.recommendations.map((r: any) => r.id);
        await chatSessionService.updateLastRecommendations(sessionId, recommendedIds);
      }

      // Detectar si el usuario está rechazando recomendaciones
      const rejectionPatterns = [
        /no me gustan estos/i,
        /dame otros/i,
        /no quiero estos/i,
        /muéstrame otros/i
      ];

      const isRejection = rejectionPatterns.some(pattern => pattern.test(userMessage));
      if (isRejection && currentSession?.last_recommendations?.length) {
        await chatSessionService.updateRejectedItems(sessionId, currentSession.last_recommendations);
        console.log('🚫 RECHAZO DETECTADO:', {
          rejectedIds: currentSession.last_recommendations,
          timestamp: new Date().toISOString()
        });
      }

      const result = await this.handleAssistantMessage(response, candidates);

      // Guardar la respuesta del asistente en la base de datos con su contenido correcto
      try {
        let messageContent = '';
        
        // Determinar el contenido según el tipo de respuesta
        if (result.type === 'recommendations' && Array.isArray(result.data) && result.data.length > 0) {
          // Para recomendaciones, convertir los datos en texto útil
          messageContent = `Te recomiendo: ${result.data.map(item => 
            `${item.name} - ${item.reason}`
          ).join('. ')}`;
        } else if (result.type === 'product_details' && result.product) {
          // Para detalles de producto
          messageContent = `${result.product.item.name}: ${result.product.explanation}`;
        } else {
          // Para texto normal u otros tipos
          messageContent = result.content || '';
        }
        
        const assistantMessage = {
          role: 'assistant' as const,
          content: messageContent,
          timestamp: new Date()
        };
        
        await chatSessionService.addMessage(sessionId, assistantMessage);
        console.log('✅ Respuesta del asistente guardada:', {
          sessionId,
          contentLength: messageContent.length,
          messageType: result.type,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error al guardar respuesta del asistente:', error);
        // Continuamos aunque falle el guardado
      }

      return result;
    } catch (error) {
      console.error('❌ ERROR EN PROCESAMIENTO:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      this.stopTyping();
    }
  }

  private buildCandidatesBlock(items: Array<MenuItem & { category_info: {id:string,name:string}[] }>): string {
    return items.map(item => `
      ID: ${item.id}
      Nombre: ${item.name}
      Descripción: ${item.description || 'No disponible'}
      Precio: ${item.price}
      Categorías: ${item.category_info.map(c => c.name).join(', ')}
      ${item.image_url ? `Imagen: ${item.image_url}` : ''}
    `).join('\n---\n');
  }

  private async handleAssistantMessage(
    msg: OpenAI.Chat.Completions.ChatCompletionMessage,
    originalItems?: Array<MenuItem & { category_info: {id:string,name:string}[] }>
  ): Promise<ChatResponse> {
    if (msg.function_call) {
      const { name, arguments: args } = msg.function_call;
      let parsedArgs;
      try {
        parsedArgs = JSON.parse(args);
      } catch (error) {
        console.error("Error al parsear argumentos de function_call:", error);
        return {
          type: 'text',
          content: 'Lo siento, tuve un problema al procesar la respuesta. ¿Podrías intentarlo de nuevo?'
        };
      }

      if (name === 'recommend_dishes') {
        if (!parsedArgs.recommendations || !Array.isArray(parsedArgs.recommendations)) {
          console.warn('⚠️ Faltan recomendaciones o no es un array en la respuesta de GPT:', parsedArgs);
          return {
            type: 'text',
            content: 'Parece que no encontré recomendaciones específicas esta vez. ¿Te gustaría que intente buscar algo más general o que me des más detalles sobre lo que te apetece?'
          };
        }
        
        // Verificar explícitamente si hay IDs inválidos en las recomendaciones
        const invalidIds = parsedArgs.recommendations
          .filter((rec: any) => typeof rec.id === 'string' && !originalItems?.some(item => item.id === rec.id))
          .map((rec: any) => rec.id);
          
        if (invalidIds.length > 0) {
          console.warn('⚠️ GPT generó IDs inválidos en las recomendaciones:', invalidIds);
        }
        
        const validRecommendations = parsedArgs.recommendations
          .map((rec: any) => {
            let originalItem = originalItems?.find(item => item.id === rec.id);

            // Inicio de la lógica de parche para IDs no UUID
            if (!originalItem && typeof rec.id === 'string' && originalItems) {
              console.warn(`GPT recommended ID "${rec.id}" is not a valid menu item ID. Attempting to match by name.`);
              const nameToMatch = rec.id.toLowerCase().replace(/-/g, ' ').trim();
              originalItem = originalItems.find(item => item.name.toLowerCase().trim() === nameToMatch);
              if (originalItem) {
                console.log(`Successfully matched non-matching ID "${rec.id}" to item "${originalItem.name}" (ID: ${originalItem.id}) by name.`);
              } else {
                console.warn(`Could not match non-matching ID "${rec.id}" to any candidate by name either.`);
              }
            }
            // Fin de la lógica de parche

            if (!originalItem) {
              console.warn('⚠️ Item original no encontrado para el ID de recomendación:', rec.id);
              return null;
            }

            return {
              id: originalItem.id,
              name: originalItem.name,
              price: originalItem.price,
              reason: rec.reason || `Una excelente opción para disfrutar.`,
              image_url: originalItem.image_url || '/images/default-food.jpg',
              category_info: originalItem.category_info || []
            };
          })
          .filter(Boolean);

        if (validRecommendations.length === 0) {
          return {
            type: 'text',
            content: 'Intenté seleccionar algunas opciones, pero no encontré coincidencias exactas con los productos disponibles en este momento. ¿Podrías reformular tu pregunta o darme más detalles sobre tus preferencias?'
          };
        }

        return {
          type: 'recommendations',
          content: msg.content || '',
          data: validRecommendations
        };
      } else if (name === 'get_product_details') {
        let originalItem = originalItems?.find(item => item.id === parsedArgs.product_id);

        if (!originalItem && typeof parsedArgs.product_id === 'string' && !isValidUUID(parsedArgs.product_id) && originalItems) {
          console.warn(`GPT requested details for non-UUID ID "${parsedArgs.product_id}". Attempting to match by name.`);
          const nameToMatch = parsedArgs.product_id.toLowerCase().replace(/-/g, ' ').trim();
          originalItem = originalItems.find(item => item.name.toLowerCase().trim() === nameToMatch);
          if (originalItem) {
            console.log(`Successfully matched non-UUID "${parsedArgs.product_id}" to item "${originalItem.name}" (ID: ${originalItem.id}) for details by name.`);
          } else {
            console.warn(`Could not match non-UUID ID "${parsedArgs.product_id}" for details by name either.`);
          }
        }

        if (!originalItem) {
          console.warn('⚠️ Item original no encontrado para detalles del producto:', parsedArgs.product_id);
          return {
            type: 'text',
            content: msg.content || 'Lo siento, no pude encontrar los detalles del producto que mencionaste. ¿Hay algo más en lo que pueda ayudarte?'
          };
        }

        const explanation = parsedArgs.explanation || originalItem.description || "Un plato delicioso de nuestro menú.";

        return {
          type: 'product_details',
          content: msg.content || `Aquí tienes más detalles sobre ${originalItem.name}:`,
          product: {
            item: {
              id: originalItem.id,
              name: originalItem.name,
              description: originalItem.description,
              price: originalItem.price,
              image_url: originalItem.image_url || '/images/default-food.jpg',
              category_info: originalItem.category_info,
              food_info: (originalItem as any).food_info,
              origin: (originalItem as any).origin,
              pairing_suggestion: (originalItem as any).pairing_suggestion,
              chef_notes: (originalItem as any).chef_notes,
              calories_est_min: (originalItem as any).calories_est_min,
              calories_est_max: (originalItem as any).calories_est_max,
              is_vegetarian_base: (originalItem as any).is_vegetarian_base,
              is_vegan_base: (originalItem as any).is_vegan_base,
              is_gluten_free_base: (originalItem as any).is_gluten_free_base,
            },
            explanation: explanation
          }
        };
      }
    }

    // Si no hay function_call, o es un tipo no manejado explícitamente arriba
    if (msg.content) {
      return {
        type: 'text',
        content: msg.content
      };
    }
    
    // Fallback final si no hay contenido ni function_call válida
    console.warn("Respuesta de GPT sin contenido ni function_call válida:", msg);
    return {
      type: 'text',
      content: 'No estoy seguro de cómo responder a eso. ¿Podrías intentarlo de otra manera?'
    };
  }
} 