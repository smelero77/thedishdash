'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatSession } from '../../domain/entities/ChatSession';
import { SessionRepository } from '../../domain/ports/SessionRepository';
import { TimeOfDay } from '../../domain/types/TimeOfDay';

interface UseSessionProps {
  sessionRepository: SessionRepository;
  initialAlias?: string;
}

interface UseSessionReturn {
  session: ChatSession | null;
  isLoading: boolean;
  error: Error | null;
  updateSession: (updates: Partial<ChatSession>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useSession({ sessionRepository, initialAlias = 'Cliente' }: UseSessionProps): UseSessionReturn {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Intentar obtener una sesión existente
      const existingSession = await sessionRepository.getSession(initialAlias);
      
      if (existingSession) {
        setSession(existingSession);
        return;
      }

      // Si no existe, crear una nueva
      const newSession = await sessionRepository.createSession(initialAlias);
      setSession(newSession);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar la sesión'));
    } finally {
      setIsLoading(false);
    }
  }, [sessionRepository, initialAlias]);

  const updateSession = useCallback(async (updates: Partial<ChatSession>) => {
    if (!session) return;

    try {
      setIsLoading(true);
      setError(null);

      const updatedSession = new ChatSession(
        session.id,
        updates.deviceId || session.deviceId,
        updates.tableCode || session.tableCode,
        updates.startedAt || session.startedAt,
        updates.lastActive || session.lastActive,
        updates.systemContext || session.systemContext,
        updates.timeOfDay || session.timeOfDay
      );

      await sessionRepository.updateSession(updatedSession);
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar la sesión'));
    } finally {
      setIsLoading(false);
    }
  }, [session, sessionRepository]);

  const refreshSession = useCallback(async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      setError(null);
      await sessionRepository.updateLastActive(session.id);
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al refrescar la sesión'));
    } finally {
      setIsLoading(false);
    }
  }, [session, sessionRepository, loadSession]);

  // Cargar sesión al montar el componente
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Actualizar lastActive periódicamente
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      refreshSession();
    }, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(interval);
  }, [session, refreshSession]);

  return {
    session,
    isLoading,
    error,
    updateSession,
    refreshSession
  };
} 