'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../../domain/types';
import { ChatClient } from '../../infrastructure/api/chatClient';

export function useChat(alias: string = 'Cliente') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('chatSessionId');
    return saved || uuidv4();
  });

  const chatClient = new ChatClient();

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    try {
      const response = await chatClient.sendMessage({
        sessionId,
        alias,
        message: content
      });

      const newMessage: Message = {
        id: uuidv4(),
        sessionId,
        sender: 'assistant',
        content: response.data.text || '',
        createdAt: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Aquí podrías manejar el error como prefieras
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, alias]);

  return {
    messages,
    isLoading,
    sendMessage,
    sessionId
  };
} 