import { useState, useRef, useEffect } from 'react';
import { X, ChefHat } from 'lucide-react';
import { ChatIAProps, Message } from './types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

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
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-[3000ms] ease-in-out perspective-1000 ${
        isOpen 
          ? 'opacity-100 backdrop-blur-md' 
          : 'opacity-0 backdrop-blur-none'
      }`}
    >
      {/* Efecto de brillo en el fondo */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 transition-opacity duration-[3000ms] ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div 
        className={`relative w-full max-w-2xl h-[80vh] mx-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10 transition-all duration-[3000ms] ease-in-out transform-gpu ${
          isOpen 
            ? 'scale-100 opacity-100 translate-z-0 rotate-x-0' 
            : 'scale-95 opacity-0 -translate-z-200 rotate-x-12'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Efecto de brillo en los bordes */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 animate-[glow_2s_ease-in-out_infinite]" />

        {/* Partículas de entrada/salida */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full ${
                isOpen 
                  ? 'animate-[particleEntry_3s_ease-out_forwards]' 
                  : 'animate-[particleExit_3s_ease-in_forwards]'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                transform: `scale(${Math.random() * 2 + 1})`,
              }}
            />
          ))}
        </div>

        {/* Header con efecto de cristal */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-30 animate-pulse" />
                <ChefHat className="h-6 w-6 text-white relative z-10" />
              </div>
              <h2 className="text-xl font-semibold text-white">Don Gourmetón</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Mensajes con efecto de scroll suave */}
        <div className="absolute top-16 bottom-20 left-0 right-0 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input con efecto de cristal */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md border-t border-white/10">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>

        {/* Efectos de partículas continuas */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-1 h-1 bg-blue-500/20 rounded-full animate-[particle1_3s_ease-in-out_infinite]" />
          <div className="absolute w-1 h-1 bg-purple-500/20 rounded-full animate-[particle2_4s_ease-in-out_infinite]" />
          <div className="absolute w-1 h-1 bg-pink-500/20 rounded-full animate-[particle3_5s_ease-in-out_infinite]" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes glow {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.5; }
        }
        @keyframes particleEntry {
          0% { transform: scale(0) translate(0, 0) translateZ(-200px); opacity: 0; }
          20% { transform: scale(1) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) translateZ(-150px); opacity: 0.4; }
          40% { transform: scale(1.5) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) translateZ(-100px); opacity: 0.6; }
          60% { transform: scale(2) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) translateZ(-50px); opacity: 0.8; }
          80% { transform: scale(1.5) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) translateZ(-25px); opacity: 0.6; }
          100% { transform: scale(1) translate(0, 0) translateZ(0); opacity: 0; }
        }
        @keyframes particleExit {
          0% { transform: scale(1) translate(0, 0) translateZ(0); opacity: 0; }
          20% { transform: scale(1.5) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) translateZ(-25px); opacity: 0.6; }
          40% { transform: scale(2) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) translateZ(-50px); opacity: 0.8; }
          60% { transform: scale(1.5) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) translateZ(-100px); opacity: 0.6; }
          80% { transform: scale(1) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) translateZ(-150px); opacity: 0.4; }
          100% { transform: scale(0) translate(0, 0) translateZ(-200px); opacity: 0; }
        }
        @keyframes particle1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(100px, -100px) scale(2); opacity: 0.5; }
        }
        @keyframes particle2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(-100px, -50px) scale(2); opacity: 0.5; }
        }
        @keyframes particle3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(50px, 100px) scale(2); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}; 