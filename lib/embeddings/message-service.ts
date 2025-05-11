import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddingService } from './openai';
import { EmbeddingConfig } from './types';

interface Message {
  id: string;
  session_id: string;
  sender: 'guest' | 'assistant';
  content: string;
  created_at: string;
}

interface MessageEmbedding {
  message_id: string;
  embedding: number[];
  created_at?: Date;
  updated_at?: Date;
}

interface SimilarMessage {
  content: string;
  similarity: number;
}

export class MessageEmbeddingService {
  private supabase;
  private embeddingService: OpenAIEmbeddingService;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiApiKey: string,
    config: EmbeddingConfig
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.embeddingService = new OpenAIEmbeddingService(openaiApiKey, config);
  }

  async findSimilarMessages(embedding: number[], limit: number = 5) {
    const { data, error } = await this.supabase.rpc('match_messages', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit
    });

    if (error) throw error;
    return data || [];
  }

  async generateAndSaveEmbedding(messageId: string, content: string) {
    const embedding = await this.embeddingService.generateEmbedding(content);
    
    const { error } = await this.supabase
      .from('message_embeddings')
      .upsert({
        message_id: messageId,
        content,
        embedding
      });

    if (error) throw error;
    return embedding;
  }

  async searchSimilarMessages(sessionId: string, limit: number = 5): Promise<SimilarMessage[]> {
    try {
      // Usar la función RPC existente para buscar mensajes similares
      const { data: similarMessages, error: searchError } = await this.supabase
        .rpc('get_relevant_messages', {
          sess_id: sessionId,
          k: limit
        });

      if (searchError) throw searchError;

      // Transformar los resultados al formato esperado
      return similarMessages.map((m: any) => ({
        content: m.content,
        similarity: m.similarity
      }));
    } catch (error) {
      console.error('Error buscando mensajes similares:', error);
      throw error;
    }
  }

  async getMessageEmbedding(messageId: string): Promise<MessageEmbedding | null> {
    const { data, error } = await this.supabase
      .from('message_embeddings')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateSessionEmbeddings(sessionId: string): Promise<void> {
    try {
      // Obtener todos los mensajes de la sesión sin embedding
      const { data: messages, error: fetchError } = await this.supabase
        .from('messages')
        .select('id, content')
        .eq('session_id', sessionId)
        .not('id', 'in', (
          this.supabase
            .from('message_embeddings')
            .select('message_id')
        ));

      if (fetchError) throw fetchError;
      if (!messages?.length) {
        console.log('No hay mensajes nuevos para procesar');
        return;
      }

      console.log(`Procesando ${messages.length} mensajes...`);

      // Procesar cada mensaje
      for (const message of messages) {
        console.log(`\nProcesando mensaje: ${message.id}`);
        
        // Generar y guardar embedding
        await this.generateAndSaveEmbedding(message.id, message.content);
        console.log('Embedding guardado exitosamente');
      }

      console.log('\n¡Proceso completado!');
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
} 