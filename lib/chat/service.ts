import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddingService } from '../embeddings/openai';
import { MessageEmbeddingService } from '../embeddings/message-service';
import { EmbeddingConfig, EmbeddingSearchResult } from '../embeddings/types';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  private supabase;
  private openaiEmbeddingService: OpenAIEmbeddingService;
  private messageEmbeddingService: MessageEmbeddingService;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiApiKey: string,
    config: EmbeddingConfig
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openaiEmbeddingService = new OpenAIEmbeddingService(openaiApiKey, config);
    this.messageEmbeddingService = new MessageEmbeddingService(supabaseUrl, supabaseKey, openaiApiKey, config);
  }

  async processMessage(message: string, sessionId: string = uuidv4()): Promise<{
    response: string;
    menuItems: EmbeddingSearchResult[];
  }> {
    try {
      // 1. Generar embedding del mensaje
      const messageEmbedding = await this.openaiEmbeddingService.generateEmbedding(message);

      // 2. Buscar mensajes similares
      const similarMessages = await this.messageEmbeddingService.findSimilarMessages(
        messageEmbedding,
        5
      );

      // 3. Buscar items del menú relevantes
      const { data: menuItems, error: menuError } = await this.supabase.rpc(
        'match_menu_items',
        {
          query_embedding: messageEmbedding,
          match_threshold: 0.7,
          match_count: 5
        }
      );

      if (menuError) throw menuError;

      // 4. Guardar el mensaje y su embedding
      const { error: saveError } = await this.supabase
        .from('message_embeddings')
        .insert({
          message_id: uuidv4(),
          session_id: sessionId,
          content: message,
          embedding: messageEmbedding
        });

      if (saveError) throw saveError;

      // 5. Generar respuesta basada en los mensajes similares y items del menú
      const response = await this.generateResponse(message, similarMessages, menuItems);

      return {
        response,
        menuItems: menuItems || []
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  private async generateResponse(
    message: string,
    similarMessages: { content: string; similarity: number }[],
    menuItems: EmbeddingSearchResult[]
  ): Promise<string> {
    // Aquí podrías implementar la lógica para generar una respuesta
    // basada en los mensajes similares y los items del menú
    // Por ahora, devolvemos una respuesta simple
    return `He encontrado ${menuItems.length} platos que podrían interesarte. ¿Te gustaría saber más sobre alguno de ellos?`;
  }
} 