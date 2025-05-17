import { supabase } from '@/lib/supabase';
import { ChatSession, SessionState, SessionMetadata, AssistantMessageSchema, UserMessageSchema, SystemMessageSchema } from '../types/session.types';
import { CHAT_SESSION_STATES } from '../constants/config';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { CHAT_CONFIG } from '../constants/config';

export class ChatSessionService {
  private static instance: ChatSessionService;

  private constructor() {
    // Inicialización privada para singleton
  }

  public static getInstance(): ChatSessionService {
    if (!ChatSessionService.instance) {
      ChatSessionService.instance = new ChatSessionService();
    }
    return ChatSessionService.instance;
  }

  /**
   * Crea una nueva sesión de chat
   */
  public async create(
    tableNumber: number,
    userAlias: string,
    options: {
      timeOfDay?: string;
      lastActive?: Date;
      sessionDuration?: number;
    } = {},
    sessionId?: string
  ): Promise<ChatSession> {
    try {
      console.log('Creando/actualizando sesión:', {
        tableNumber,
        userAlias,
        options,
        sessionId
      });

      // Si tenemos un sessionId, intentamos recuperar la sesión existente
      if (sessionId) {
        const { data: existingSession, error: searchError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (searchError && searchError.code !== 'PGRST116') {
          console.error('Error al buscar sesión existente:', searchError);
          throw new Error(`Error searching for existing session: ${searchError.message}`);
        }

        if (existingSession) {
          console.log('Actualizando sesión existente:', sessionId);
          const { data: updatedSession, error: updateError } = await supabase
            .from('sessions')
            .update({
              table_number: tableNumber,
              alias: userAlias,
              updated_at: new Date()
            })
            .eq('id', sessionId)
            .select()
            .single();

          if (updateError) {
            console.error('Error al actualizar sesión:', updateError);
            throw new Error(`Error updating session: ${updateError.message}`);
          }

          if (!updatedSession) {
            throw new Error('No se pudo actualizar la sesión existente');
          }

          return updatedSession as ChatSession;
        }
      }

      // Si no hay sessionId o no se encontró la sesión, creamos una nueva
      const newSessionId = sessionId || uuidv4();
      const newSession = {
        id: newSessionId,
        table_number: tableNumber,
        alias: userAlias,
        started_at: new Date(),
        updated_at: new Date()
      };

      console.log('Insertando nueva sesión:', newSession);
      const { data: createdSession, error: createError } = await supabase
        .from('sessions')
        .insert(newSession)
        .select()
        .single();

      if (createError) {
        console.error('Error al crear sesión:', createError);
        throw new Error(`Error creating session: ${createError.message}`);
      }

      if (!createdSession) {
        throw new Error('No se pudo crear la sesión');
      }

      return createdSession as ChatSession;
    } catch (error) {
      console.error('Error inesperado en create:', error);
      throw error;
    }
  }

  /**
   * Obtiene una sesión por su ID
   */
  public async get(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`Sesión no encontrada: ${sessionId}`);
          return null; // Sesión no encontrada
        }
        console.error(`Error al obtener sesión ${sessionId}:`, error);
        throw new Error(`Error getting session: ${error.message}`);
      }

      return data as ChatSession;
    } catch (error) {
      console.error(`Error inesperado al obtener sesión ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza una sesión existente
   */
  public async update(
    sessionId: string,
    updates: Partial<ChatSession>
  ): Promise<ChatSession> {
    const dbUpdates = {
      table_number: updates.table_number,
      alias: updates.alias,
      started_at: updates.started_at,
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from('sessions')
      .update(dbUpdates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating session: ${error.message}`);
    }

    return data as ChatSession;
  }

  /**
   * Actualiza el estado de una sesión
   */
  public async updateState(
    sessionId: string,
    state: SessionState
  ): Promise<ChatSession> {
    return this.update(sessionId, {
      updated_at: new Date()
    });
  }

  /**
   * Añade un mensaje al historial de conversación
   */
  public async addMessage(
    sessionId: string,
    message: z.infer<typeof UserMessageSchema | typeof AssistantMessageSchema | typeof SystemMessageSchema>,
    metadataFromOrchestrator?: Record<string, any>
  ): Promise<void> {
    try {
      // Asegurar que metadataFromOrchestrator es un objeto y no undefined
      const metadata = metadataFromOrchestrator || {};
      
      // Loguear el parámetro CRUDO que llega
      console.log('[ChatSessionService.addMessage] RAW metadataFromOrchestrator:', 
                  JSON.parse(JSON.stringify(metadata)));

      let session = await this.get(sessionId);
      
      if (!session) {
        console.log(`Sesión no encontrada en addMessage, intentando recuperar o crear: ${sessionId}`);
        
        const { data: existingMessage, error: messageError } = await supabase
          .from('messages')
          .select('session_id, sender')
          .eq('session_id', sessionId)
          .limit(1)
          .single();

        if (!messageError && existingMessage) {
          session = await this.get(sessionId);
        }
        
        if (!session) {
          throw new Error(`No se pudo encontrar o crear la sesión ${sessionId}`);
        }
      }

      const sender = message.role === 'user' ? 'guest' : 
                    message.role === 'assistant' ? 'assistant' : 'system';

      // Construir la variable local messageMetadata usando metadataFromOrchestrator
      let localMessageMetadata: Record<string, any> = {};

      // Copiar directamente el metadata del orchestrator
      localMessageMetadata = { ...metadata };

      // Loguear la variable local que se va a insertar
      console.log('[ChatSessionService.addMessage] Guardando mensaje con metadatos:', {
        sessionId,
        sender,
        role: message.role,
        metadata: localMessageMetadata
      });

      // Insertar el mensaje en la BD
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          sender: sender,
          content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
          created_at: message.timestamp || new Date(),
          metadata: localMessageMetadata
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error al insertar mensaje:', insertError);
        throw new Error(`Error inserting message: ${insertError.message}`);
      }

      // Actualizar timestamp de última actividad de la sesión
      await this.update(sessionId, { updated_at: new Date() });

    } catch (error) {
      console.error('Error en addMessage:', error);
      throw error;
    }
  }

  /**
   * Obtiene los últimos N turnos de conversación
   */
  public async getLastConversationTurns(
    sessionId: string,
    turns: number = 3
  ): Promise<z.infer<typeof UserMessageSchema | typeof AssistantMessageSchema | typeof SystemMessageSchema>[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('message_index', { ascending: true })
      .limit(turns * 2);

    if (error) {
      throw new Error(`Error getting messages: ${error.message}`);
    }

    // Convertir los mensajes al formato esperado
    return (messages || []).map(msg => ({
      role: msg.sender === 'guest' ? 'user' as const : 
            msg.sender === 'assistant' ? 'assistant' as const : 'system' as const,
      content: msg.content,
      timestamp: new Date(msg.created_at),
      metadata: msg.metadata || {},
      message_index: msg.message_index
    }));
  }

  /**
   * Cierra una sesión
   */
  public async close(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sessions')
      .update({
        updated_at: new Date()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Error closing session: ${error.message}`);
    }

    return true;
  }

  /**
   * Obtiene todas las sesiones activas
   */
  public async getActiveSessions(): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Error getting active sessions: ${error.message}`);
    }

    return data as ChatSession[];
  }

  /**
   * Limpia las sesiones antiguas
   */
  public async cleanupOldSessions(maxAgeHours: number = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    const { data, error } = await supabase
      .from('sessions')
      .delete()
      .lt('updated_at', cutoffDate)
      .select();

    if (error) {
      throw new Error(`Error cleaning up old sessions: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Actualiza las últimas recomendaciones mostradas al usuario
   * Nota: Esta función no actualiza la base de datos ya que menu_items no existe
   */
  public async updateLastRecommendations(
    sessionId: string,
    recommendationIds: string[]
  ): Promise<void> {
    console.log(`Para sesión ${sessionId}, se registrarían recomendaciones: ${recommendationIds.join(', ')}`);
    // No podemos guardar en la BD ya que el campo no existe
    return;
  }

  /**
   * Obtiene las últimas recomendaciones mostradas al usuario
   * Nota: Esta función devuelve un array vacío ya que menu_items no existe en la tabla
   */
  public async getLastRecommendations(sessionId: string): Promise<string[]> {
    console.log(`Solicitadas recomendaciones para sesión ${sessionId}`);
    // No podemos recuperar datos que no existen en la BD
    return [];
  }

  /**
   * Actualiza los ítems rechazados por el usuario
   * Nota: Esta función no actualiza la base de datos ya que menu_items no existe
   */
  public async updateRejectedItems(
    sessionId: string,
    rejectedIds: string[]
  ): Promise<void> {
    console.log(`Para sesión ${sessionId}, se registrarían ítems rechazados: ${rejectedIds.join(', ')}`);
    // No podemos guardar en la BD ya que el campo no existe
    return;
  }

  /**
   * Obtiene los ítems rechazados por el usuario
   * Nota: Esta función devuelve un array vacío ya que menu_items no existe en la tabla
   */
  public async getRejectedItems(sessionId: string): Promise<string[]> {
    console.log(`Solicitados ítems rechazados para sesión ${sessionId}`);
    // No podemos recuperar datos que no existen en la BD
    return [];
  }
}

// Exportar una instancia singleton
export const chatSessionService = ChatSessionService.getInstance(); 