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
    aliasMesa: string,
    clienteId: string,
    options: {
      timeOfDay?: string;
      lastActive?: Date;
      sessionDuration?: number;
    } = {},
    sessionId?: string
  ): Promise<ChatSession> {
    try {
      console.log('Creando/actualizando sesión:', {
        aliasMesa,
        clienteId,
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
              alias_mesa: aliasMesa,
              cliente_id: clienteId,
              last_active: options.lastActive || new Date(),
              time_of_day: options.timeOfDay,
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
        alias_mesa: aliasMesa,
        cliente_id: clienteId,
        started_at: new Date(),
        last_active: options.lastActive || new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        time_of_day: options.timeOfDay,
        system_context: "Eres un asistente virtual de The Dish Dash, un restaurante moderno y acogedor. Tu objetivo es ayudar a los clientes a encontrar platos que disfruten."
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
      alias_mesa: updates.alias_mesa,
      cliente_id: updates.cliente_id,
      started_at: updates.started_at,
      last_active: updates.last_active,
      created_at: updates.created_at,
      updated_at: new Date(),
      system_context: updates.system_context,
      menu_items: updates.menu_items,
      time_of_day: updates.time_of_day
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
      last_active: new Date()
    });
  }

  /**
   * Añade un mensaje al historial de conversación
   */
  public async addMessage(
    sessionId: string,
    message: z.infer<typeof UserMessageSchema | typeof AssistantMessageSchema | typeof SystemMessageSchema>
  ): Promise<void> {
    try {
      let session = await this.get(sessionId);
      
      if (!session) {
        console.log(`Sesión no encontrada en addMessage, intentando recuperar o crear: ${sessionId}`);
        
        // Intentamos obtener el alias_mesa de algún mensaje existente
        const { data: existingMessage, error: messageError } = await supabase
          .from('messages')
          .select('session_id, sender')
          .eq('session_id', sessionId)
          .limit(1)
          .single();

        if (messageError && messageError.code !== 'PGRST116') {
          console.error('Error al buscar mensaje existente:', messageError);
          throw new Error(`Error searching for existing message: ${messageError.message}`);
        }

        if (existingMessage) {
          // Si encontramos un mensaje, la sesión debería existir
          console.error(`Inconsistencia: mensaje encontrado pero sesión no existe: ${sessionId}`);
          throw new Error(`Session inconsistency: message exists but session not found: ${sessionId}`);
        }

        // Si no hay mensajes, intentamos obtener el alias_mesa del mensaje actual
        const aliasMesa = message.role === 'user' ? 'guest' : 'assistant';
        const customerId = uuidv4(); // Generamos un nuevo UUID para el cliente
        
        // Crear nueva sesión con el alias_mesa del mensaje
        session = await this.create(
          aliasMesa,
          customerId,
          {
            timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
            lastActive: new Date(),
            sessionDuration: 0
          },
          sessionId
        );

        if (!session) {
          throw new Error('No se pudo crear la sesión para el mensaje');
        }
      }

      // Insertar el mensaje
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          sender: message.role === 'user' ? 'guest' : 'assistant',
          content: message.content || '',
          created_at: message.timestamp
        });

      if (insertError) {
        console.error(`Error al insertar mensaje en sesión ${sessionId}:`, insertError);
        throw new Error(`Error adding message: ${insertError.message}`);
      }

      // Actualizar last_active de la sesión
      await this.update(sessionId, {
        last_active: new Date()
      });
    } catch (error) {
      console.error(`Error inesperado en addMessage para sesión ${sessionId}:`, error);
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
      .order('created_at', { ascending: false })
      .limit(turns * 2);

    if (error) {
      throw new Error(`Error getting messages: ${error.message}`);
    }

    // Convertir los mensajes al formato esperado
    return (messages || []).map(msg => {
      if (msg.sender === 'guest') {
        return {
          role: 'user' as const,
          content: msg.content,
          timestamp: new Date(msg.created_at)
        };
      } else {
        return {
          role: 'assistant' as const,
          content: msg.content,
          timestamp: new Date(msg.created_at)
        };
      }
    }).reverse();
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
      .order('last_active', { ascending: false });

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
      .lt('last_active', cutoffDate)
      .select();

    if (error) {
      throw new Error(`Error cleaning up old sessions: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Actualiza las últimas recomendaciones mostradas al usuario
   */
  public async updateLastRecommendations(
    sessionId: string,
    recommendationIds: string[]
  ): Promise<void> {
    const { data: session } = await supabase
      .from('sessions')
      .select('menu_items')
      .eq('id', sessionId)
      .single();

    const menuItems = session?.menu_items || {};
    const updatedMenuItems = {
      ...menuItems,
      last_recommendations: recommendationIds
    };

    const { error } = await supabase
      .from('sessions')
      .update({
        menu_items: updatedMenuItems,
        updated_at: new Date()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Error updating last recommendations: ${error.message}`);
    }
  }

  /**
   * Obtiene las últimas recomendaciones mostradas al usuario
   */
  public async getLastRecommendations(sessionId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('menu_items')
      .eq('id', sessionId)
      .single();

    if (error) {
      throw new Error(`Error getting last recommendations: ${error.message}`);
    }

    return (data?.menu_items as any)?.last_recommendations || [];
  }

  /**
   * Actualiza los ítems rechazados por el usuario
   */
  public async updateRejectedItems(
    sessionId: string,
    rejectedIds: string[]
  ): Promise<void> {
    const { data: session } = await supabase
      .from('sessions')
      .select('menu_items')
      .eq('id', sessionId)
      .single();

    const menuItems = session?.menu_items || {};
    const updatedMenuItems = {
      ...menuItems,
      rejected_items: rejectedIds
    };

    const { error } = await supabase
      .from('sessions')
      .update({
        menu_items: updatedMenuItems,
        updated_at: new Date()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Error updating rejected items: ${error.message}`);
    }
  }

  /**
   * Obtiene los ítems rechazados por el usuario
   */
  public async getRejectedItems(sessionId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('menu_items')
      .eq('id', sessionId)
      .single();

    if (error) {
      throw new Error(`Error getting rejected items: ${error.message}`);
    }

    return (data?.menu_items as any)?.rejected_items || [];
  }
}

// Exportar una instancia singleton
export const chatSessionService = ChatSessionService.getInstance(); 