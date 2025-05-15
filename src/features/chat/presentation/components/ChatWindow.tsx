'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChefHat, ArrowDown } from 'lucide-react';
import { Message, AssistantResponse } from '@/features/chat/domain/entities';
import React from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { v4 as uuidv4 } from 'uuid';
import './animations.css';

interface ChatIAProps {
  isOpen: boolean;
  onClose: () => void;
  alias?: string;
  categoryId?: string;
}

export const ChatWindow = ({ isOpen, onClose, alias = 'Cliente' }: ChatIAProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(uuidv4());
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Debug logs
  useEffect(() => {
    console.log('ChatWindow - isOpen:', isOpen);
    console.log('ChatWindow - messages:', messages);
  }, [isOpen, messages]);

  // Reset messages when closing
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
    }
  }, [isOpen]);

  // Add welcome message when opening and empty
  useEffect(() => {
    const addWelcomeMessage = () => {
      if (isOpen && messages.length === 0) {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          timestamp: new Date(),
          content: {
            type: 'assistant_text',
            data: { 
              text: `¡Hola ${alias || 'Cliente'}! Soy Don Gourmetón, ¿en qué puedo ayudarte hoy?` 
            }
          }
        };
        setMessages([welcomeMessage]);
      }
    };

    // Pequeño delay para asegurar que el componente está montado
    const timer = setTimeout(addWelcomeMessage, 100);
    return () => clearTimeout(timer);
  }, [isOpen, alias, messages.length]);

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

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    console.log('=== INICIO DEL FLUJO DE CHAT ===');
    console.log('1. Mensaje del usuario:', text);
    console.log('2. Session ID:', sessionId.current);
    console.log('3. Alias:', alias);

    // Crear mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: {
        type: 'user_text',
        data: { text }
      },
      timestamp: new Date()
    };

    console.log('4. Mensaje formateado para el estado:', userMessage);

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('5. Preparando petición al API');
      const requestBody = { 
        message: text,
        sessionId: sessionId.current,
        alias: alias || 'Cliente',
        tableNumber: 0
      };
      console.log('6. Payload completo:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('7. Error en la respuesta:', errorData);
        throw new Error(errorData.message || 'Error en la respuesta');
      }

      const data = await response.json() as {
        response: AssistantResponse;
        sessionId: string;
      };

      console.log('8. Respuesta del API:', JSON.stringify(data, null, 2));

      // Actualiza el sessionId si es necesario
      if (data.sessionId !== sessionId.current) {
        console.log('9. Actualizando Session ID:', data.sessionId);
        sessionId.current = data.sessionId;
      }

      // Crear mensaje del asistente con solo el AssistantResponse
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      console.log('10. Mensaje del asistente formateado:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('11. Error en el proceso:', error);
      
      // Crear mensaje de error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: {
          type: 'assistant_text',
          data: {
            text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.'
          }
        },
        timestamp: new Date()
      };

      console.log('12. Mensaje de error formateado:', errorMessage);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      console.log('=== FIN DEL FLUJO DE CHAT ===\n');
    }
  };

  const handleViewDetails = (productId: string) => {
    console.log('Ver detalles de', productId);
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
          className="flex-1 overflow-y-auto pt-20 pb-24 px-4 space-y-4"
          onScroll={handleScroll}
        >
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onViewDetails={handleViewDetails}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Botón de scroll */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 p-2 rounded-full bg-[#1ce3cf] text-white shadow-lg hover:bg-[#1ce3cf]/90 active:scale-95 transition-all duration-200"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}

        {/* Input */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-[#f5fefe] dark:bg-[#0f1b1a] border-t border-[#c7f0ec]/30 ${isOpen ? 'slide-up' : ''}`}>
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            value={inputValue}
            onChange={setInputValue}
            alias={alias}
          />
        </div>
      </div>
    </div>
  );
}; 