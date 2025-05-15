'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatSession } from '../../domain/entities/ChatSession';
import { Message } from '../../domain/entities/Message';

interface UseSessionReturn {
  sessionId: string | null;
  initialMessages: Message[];
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

export const useSession = (customerId: string | null, tableNumber: string | null): UseSessionReturn => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!customerId || !tableNumber) {
      setError('Customer ID and table number are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/chat/session?customerId=${encodeURIComponent(customerId)}&tableNumber=${encodeURIComponent(tableNumber)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setInitialMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
      setSessionId(null);
      setInitialMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, tableNumber]);

  useEffect(() => {
    if (customerId && tableNumber) {
      fetchSession();
    }
  }, [customerId, tableNumber, fetchSession]);

  return {
    sessionId,
    initialMessages,
    isLoading,
    error,
    refreshSession: fetchSession
  };
}; 