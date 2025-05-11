import { useState, useEffect, useRef } from 'react';
import { AssistantResponse } from '@/lib/chat/types/response.types';
import { ChatMessage } from '@/app/components/ChatIA/ChatMessage';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';

interface ChatIAProps {
  alias: string;
  categoryId?: string;
}

export function ChatIA({ alias, categoryId }: ChatIAProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string | AssistantResponse }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
    console.log('🔄 Formulario enviado');
    console.log('📝 Input:', input);
    console.log('⏳ Loading:', isLoading);

    if (!input.trim() || isLoading) {
      console.log('❌ Input vacío o ya cargando');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    console.log('👤 Mensaje del usuario:', userMessage);

    // Añadir mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      console.log('📤 Enviando petición a /api/chat');
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

      console.log('📥 Respuesta recibida:', response.status);
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      
      // Actualizar sessionId si es nuevo
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      // Simular tiempo de escritura
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Añadir respuesta del asistente
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('❌ Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: { 
          type: 'assistant_text', 
          content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.' 
        } 
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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
        {isTyping && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            <span className="text-sm">Don Gourmetón está escribiendo...</span>
          </div>
        )}
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
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
          >
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
} 