import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { ChatInputProps } from './types';

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_CHARS = 500;

  useEffect(() => {
    // Auto-focus input when component mounts
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
      // Re-focus input after sending
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t border-[#d0e6e4] bg-white">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          className="w-full rounded-full border border-[#d0e6e4] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f968f] transition-all duration-200 disabled:opacity-50"
          disabled={isLoading}
          maxLength={MAX_CHARS}
          aria-label="Mensaje"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          {message.length}/{MAX_CHARS}
        </div>
      </div>
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#4f968f] to-[#1ce3cf] text-white disabled:opacity-50 hover:from-[#4f968f]/90 hover:to-[#1ce3cf]/90 transition-all duration-200"
        aria-label="Enviar mensaje"
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
}; 