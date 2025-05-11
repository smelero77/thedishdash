import { useState, useEffect, useRef } from 'react';
import { AssistantResponse } from '@/lib/chat/types/response.types';
import { ChatMessage } from './ChatMessage';
import { v4 as uuidv4 } from 'uuid';

interface ChatIAProps {
  alias: string;
  categoryId?: string;
}

export function ChatIA({ alias, categoryId }: ChatIAProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string | AssistantResponse }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    // Intentar recuperar sessionId del localStorage
    const saved = localStorage.getItem('chatSessionId');
    return saved || uuidv4();
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Guardar sessionId en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('chatSessionId', sessionId);
  }, [sessionId]);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Añadir mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          alias,
          categoryId
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      
      // Actualizar sessionId si es nuevo
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      // Añadir respuesta del asistente
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: { 
          type: 'assistant_text', 
          content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.' 
        } 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (productId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Dame detalles del plato ${productId}`,
          sessionId,
          alias,
          categoryId
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: { 
          type: 'assistant_text', 
          content: 'Lo siento, no pude obtener los detalles del plato. Por favor, intenta de nuevo.' 
        } 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage 
            key={index}
            role={message.role}
            content={message.content}
            onViewDetails={handleViewDetails}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 p-2 border rounded"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
          >
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
} 