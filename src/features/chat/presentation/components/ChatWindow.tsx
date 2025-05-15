'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChefHat, ArrowDown } from 'lucide-react';
import { Message } from '@/features/chat/domain/entities';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useSession } from '../hooks/useSession';
import { useCustomer } from '@/context/CustomerContext';
import { useTable } from '@/context/TableContext';
import { useCurrentSlot } from '@/hooks/useCurrentSlot';
import { useCartItemsContext } from '@/context/CartItemsContext';
import { useWeather } from '@/hooks/useWeather';
import './animations.css';
import type { MessageContext } from '../../domain/types';

interface ChatWindowProps {
  customerId: string;
  tableNumber: string;
  context?: MessageContext;
}

export function ChatWindow({ customerId, tableNumber, context }: ChatWindowProps) {
  const { alias } = useCustomer();
  const { currentSlot } = useCurrentSlot();
  const cartItemsContext = useCartItemsContext();
  const { weather } = useWeather();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Usar el hook useSession actualizado
  const { 
    initialMessages, 
    isLoading: isLoadingSession, 
    error: sessionError 
  } = useSession(customerId, tableNumber?.toString());

  // Cargar mensajes iniciales cuando se obtienen de la sesión
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Manejar scroll y botón de scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          customerId,
          tableNumber,
          message: messageToSend,
          context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setSessionId(data.sessionId);

      // Agregar mensaje del usuario
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageToSend,
        timestamp: new Date()
      }]);

      // Agregar respuesta del asistente
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response.data.text,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Agregar mensaje de error
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionId) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chat con el Asistente</h2>
        <p className="text-sm text-gray-500">Mesa {tableNumber}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingSession ? (
          <div className="flex items-center justify-center h-full">
            <p>Inicializando chat...</p>
          </div>
        ) : sessionError ? (
          <div className="flex items-center justify-center h-full text-red-600">
            <p>Error: {sessionError}</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe tu mensaje..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
} 