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
  ): Promise<ChatResponse> {
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

      // Verificar y crear sesión si no existe
      let currentSession = await chatSessionService.get(sessionId);
      if (!currentSession) {
        console.log('Sesión no encontrada en processMessage, creando nueva:', sessionId);
        const customerId = uuidv4();
        currentSession = await chatSessionService.create(
          userAlias,
          customerId,
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
          
          Instrucciones:
          1. Si el usuario rechaza recomendaciones ("no me gustan estos", "dame otros"), evita sugerir los mismos platos.
          2. Mantén un tono amigable y profesional.
          3. Haz preguntas específicas para entender mejor las preferencias del usuario.
          4. Sugiere combinaciones de platos cuando sea apropiado.
          5. Menciona características especiales de los platos (ej. "sin gluten", "vegetariano").`
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
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0].message;
      console.log('🤖 RESPUESTA GPT:', {
        content: response.content,
        function_call: response.function_call,
        timestamp: new Date().toISOString()
      });

      // Guardar respuesta del asistente en el historial
      await chatSessionService.addMessage(sessionId, {
        role: 'assistant',
        content: response.content,
        function_call: response.function_call ? {
          name: response.function_call.name,
          arguments: response.function_call.arguments
        } : undefined,
        timestamp: new Date()
      });

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

      return this.handleAssistantMessage(response, candidates);
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
    msg: any,
    originalItems?: Array<MenuItem & { category_info: {id:string,name:string}[] }>
  ): Promise<ChatResponse> {
    if (msg.function_call) {
      const { name, arguments: args } = msg.function_call;
      const parsedArgs = JSON.parse(args);

      if (name === 'recommend_dishes') {
        // Mapear los IDs de las recomendaciones a los items originales para obtener la información completa
        const recommendations = parsedArgs.recommendations.map((rec: any) => {
          const originalItem = originalItems?.find(item => item.id === rec.id);
          if (!originalItem) {
            console.warn('⚠️ Item original no encontrado:', rec.id);
            return rec;
          }
          
          return {
            id: rec.id,
            name: rec.name,
            price: originalItem.price,
            reason: rec.reason,
            image_url: originalItem.image_url || '/images/default-food.jpg',
            category_info: originalItem.category_info
          };
        });

        return {
          type: 'recommendations',
          content: msg.content || '',
          data: recommendations
        };
      } else if (name === 'get_product_details') {
        const originalItem = originalItems?.find(item => item.id === parsedArgs.product.id);
        if (!originalItem) {
          console.warn('⚠️ Item original no encontrado para detalles:', parsedArgs.product.id);
          return {
            type: 'product_details',
            content: msg.content || '',
            product: parsedArgs.product
          };
        }

        return {
          type: 'product_details',
          content: msg.content || '',
          product: {
            item: {
              id: originalItem.id,
              name: originalItem.name,
              price: originalItem.price,
              image_url: originalItem.image_url || '/images/default-food.jpg'
            },
            explanation: parsedArgs.product.explanation
          }
        };
      }
    }

    return {
      type: 'text',
      content: msg.content || 'Lo siento, no pude procesar tu solicitud.'
    };
  }
} 