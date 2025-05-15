import { useState, useRef, useEffect } from 'react';
import { X, ChefHat, ArrowDown } from 'lucide-react';
import { ChatIAProps, Message } from './types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { v4 as uuidv4 } from 'uuid';
import './animations.css';

export const ChatIA = ({ isOpen, onClose, alias = 'Cliente' }: ChatIAProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(uuidv4());
  const [isTyping, setIsTyping] = useState(false);

  // Add welcome message from Don Gourmetón when chat opens and there are no messages
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          content: {
            type: 'assistant_text',
            content: `¡Hola ${alias}! Soy Don Gourmetón, ¿en qué puedo ayudarte hoy?`
          },
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

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
      setShowScrollButton(!isAtBottom);
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Verificar la posición inicial
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'guest',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: sessionId.current,
          alias,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: {
          type: 'assistant_text',
          content: data.response
        },
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: {
          type: 'assistant_text',
          content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.'
        },
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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
        <div 
          ref={messagesContainerRef}
          className={`
            absolute top-16 bottom-20 left-0 right-0 
            overflow-y-auto px-4 py-4 space-y-4
            custom-scrollbar
            ${isOpen ? 'slide-in' : ''}
          `}
          onScroll={handleScroll}
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} alias={alias} />
          ))}
          {isTyping && (
            <div className="flex items-center space-x-3">
              <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1ce3cf] text-white text-xl">
                👨‍🍳
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[#1ce3cf] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#1ce3cf] rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-[#1ce3cf] rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Botón de scroll */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-4 p-4 rounded-full bg-[#11c9b7] text-white shadow-lg active:scale-95 active:bg-[#11c9b7]/90 transition-all duration-200 z-10 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowDown className="h-6 w-6" />
          </button>
        )}

        {/* Input */}
        <div className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#f5fefe] to-transparent dark:from-[#0f1b1a] dark:to-transparent ${isOpen ? 'slide-in' : ''}`}>
          <ChatInput onSend={handleSend} isLoading={isLoading} alias={alias} />
        </div>
      </div>
    </div>
  );
}; 