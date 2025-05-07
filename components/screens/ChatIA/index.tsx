import { useState, useRef, useEffect } from 'react';
import { X, ChefHat } from 'lucide-react';
import { ChatIAProps, Message } from './types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import './animations.css';

export const ChatIA = ({ isOpen, onClose, alias = 'Cliente' }: ChatIAProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message from Don Gourmetón when chat opens and there are no messages
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          content: `¡Hola ${alias}! Soy Don Gourmetón, ¿en qué puedo ayudarte hoy?`,
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, alias]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // TODO: Implementar llamada a la API de IA
      const response = "Esta es una respuesta de prueba del asistente.";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } transition-opacity duration-300`}
    >
      {/* Overlay con blur */}
      <div 
        className={`absolute inset-0 backdrop-blur-sm ${
          isOpen ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
      />

      {/* Contenedor principal */}
      <div 
        className={`
          relative w-full max-w-2xl h-[80vh] mx-4 
          bg-[#f5fefe] dark:bg-[#0f1b1a]
          rounded-3xl shadow-2xl overflow-hidden border border-[#c7f0ec]/30
          ${isOpen ? 'fade-in' : 'opacity-0'}
        `}
      >
        {/* Partículas flotantes */}
        {isOpen && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle absolute w-2 h-2 bg-[#1ce3cf]/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Header */}
        <div className={`absolute top-0 left-0 right-0 h-16 bg-[#1ce3cf] dark:bg-[#1ce3cf]/90 backdrop-blur-md border-b border-[#c7f0ec]/30 ${isOpen ? 'slide-in' : ''}`}>
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-white/20 rounded-full blur opacity-30 animate-pulse" />
                <ChefHat className="h-6 w-6 text-white relative z-10" />
              </div>
              <h2 className="text-xl font-semibold text-white">Don Gourmetón</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all duration-200"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div className={`absolute top-16 bottom-20 left-0 right-0 overflow-y-auto px-4 py-4 space-y-4 ${isOpen ? 'slide-in' : ''}`}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} alias={alias} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#f5fefe] to-transparent dark:from-[#0f1b1a] dark:to-transparent ${isOpen ? 'slide-in' : ''}`}>
          <ChatInput onSend={handleSend} isLoading={isLoading} alias={alias} />
        </div>
      </div>
    </div>
  );
}; 