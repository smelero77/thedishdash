import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { ChatInputProps } from './types';

function getInitials(name: string) {
  const words = name.split(' ');
  if (words.length >= 2) {
    // Si hay dos o más palabras, toma la primera letra de la primera y última palabra
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else {
    // Si solo hay una palabra, toma las dos primeras letras
    return (words[0].slice(0, 2)).toUpperCase();
  }
}

export const ChatInput = ({ onSend, isLoading, alias = 'Cliente' }: ChatInputProps & { alias?: string }) => {
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
    <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 pb-2">
      <span className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-[#1ce3cf] text-white text-sm">
        {getInitials(alias)}
      </span>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          className="w-full rounded-2xl bg-white/80 dark:bg-[#0f1b1a]/80 backdrop-blur-sm border border-[#c7f0ec]/50 px-4 py-2.5 text-sm text-[#111111] dark:text-white placeholder-[#111111]/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#1ce3cf]/50 transition-all duration-200 disabled:opacity-50"
          disabled={isLoading}
          maxLength={MAX_CHARS}
          aria-label="Mensaje"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#111111]/40 dark:text-white/40">
          {message.length}/{MAX_CHARS}
        </div>
      </div>
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#11c9b7] disabled:bg-[#b5e9e3] text-white disabled:opacity-50 active:scale-95 transition-all duration-200 shadow-lg shadow-[#1ce3cf]/20"
        aria-label="Enviar mensaje"
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
}; 