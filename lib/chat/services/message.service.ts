import OpenAI from 'openai';
import { OpenAIEmbeddingService } from '@/lib/embeddings/services/openai.service';
import { ChatOrchestrator } from '../orchestration/ChatOrchestrator';
import { supabase } from '@/lib/supabase';
import { AssistantResponse } from '../types/response.types';
import { ChatSession } from '../types/session.types';

export class ChatMessageService {
  private chatOrchestrator: ChatOrchestrator;

  constructor(
    openaiApiKey: string,
    private embeddingService: OpenAIEmbeddingService
  ) {
    console.log('🔧 ChatMessageService: Inicializando ChatOrchestrator...');
    
    try {
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

  public async processMessage(
    session: ChatSession,
    message: string,
    categoryId?: string
  ): Promise<AssistantResponse> {
    try {
      return await this.chatOrchestrator.processUserMessage(session, message, categoryId);
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      return {
        type: 'error',
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje.',
        error: {
          code: 'MESSAGE_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
} 