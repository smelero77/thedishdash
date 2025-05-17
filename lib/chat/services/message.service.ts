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
import { ChatOrchestrator } from '../orchestration/ChatOrchestrator';

// Función auxiliar para validar UUIDs
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export class ChatMessageService {
  private openai: OpenAI;
  private isTyping: boolean = false;
  private typingInterval: NodeJS.Timeout | null = null;
  private chatOrchestrator: ChatOrchestrator;

  constructor(
    openaiApiKey: string,
    private embeddingService: OpenAIEmbeddingService
  ) {
    this.openai = new OpenAI({ 
      apiKey: openaiApiKey
    });
    
    console.log('🔧 ChatMessageService: Intentando inicializar ChatOrchestrator...', { timestamp: new Date().toISOString() });
    
    try {
      // Inicializar el ChatOrchestrator
      this.chatOrchestrator = new ChatOrchestrator(
        openaiApiKey,
        supabase,
        this.embeddingService
      );
      console.log('✅ ChatMessageService: ChatOrchestrator inicializado correctamente');
    } catch (error) {
      console.error('❌ ChatMessageService: Error al inicializar ChatOrchestrator:', error);
      throw error;
    }
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
      
      console.log('✅ DELEGANDO PROCESAMIENTO A ORCHESTRATOR:', {
        sessionId: currentSession.id,
        userMessage,
        categoryId,
        timestamp: new Date().toISOString()
      });
      
      // Usar el ChatOrchestrator para procesar el mensaje
      const result = await this.chatOrchestrator.processUserMessage(
        currentSession, 
        userMessage, 
        categoryId
      );
      
      console.log('✅ RESPUESTA DEL ORCHESTRATOR:', {
        sessionId: currentSession.id,
        responseType: result.type,
        hasContent: !!result.content,
        hasData: result.data ? Array.isArray(result.data) ? result.data.length : 'object' : false,
        timestamp: new Date().toISOString()
      });
      
      this.stopTyping();
      return result;
    } catch (error) {
      this.stopTyping();
      console.error('❌ ERROR EN PROCESO DE MENSAJE:', error);
      
      // Guardar un mensaje de error en el historial
      try {
        await chatSessionService.addMessage(sessionId, {
          role: 'system',
          content: 'Error procesando mensaje: ' + (error instanceof Error ? error.message : 'Error desconocido'),
          timestamp: new Date()
        }, {
          error: true,
          errorDetails: {
            message: error instanceof Error ? error.message : 'Error desconocido',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          }
        });
      } catch (saveError) {
        console.error('Error adicional al guardar mensaje de error:', saveError);
      }
      
      return {
        type: 'error',
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
        error: {
          code: 'MESSAGE_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Error desconocido'
        }
      };
    }
  }

  // Mantenemos los métodos auxiliares que podrían ser necesarios para otras partes del código
  private buildCandidatesBlock(items: Array<MenuItem & { category_info: {id:string,name:string}[] }>): string {
    if (!items || items.length === 0) {
      return "No hay platos disponibles que coincidan con tus criterios.";
    }
    
    return items.map((item, i) => 
      `${i+1}. "${item.name}" - $${item.price} - ${item.category_info.map(c => c.name).join(', ')}`
    ).join('\n');
  }
  
  private async handleAssistantMessage(
    msg: OpenAI.Chat.Completions.ChatCompletionMessage,
    originalItems?: Array<MenuItem & { category_info: {id:string,name:string}[] }>,
    priceMin?: number,
    priceMax?: number
  ): Promise<ChatResponse> {
    // Este método no es necesario ahora que usamos ChatOrchestrator
    throw new Error("Este método está obsoleto. Usar ChatOrchestrator en su lugar.");
  }
} 