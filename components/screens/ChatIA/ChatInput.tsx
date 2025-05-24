import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  alias: string;
}

function getInitials(name: string) {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (name[0] + (name[1] || name[0])).toUpperCase();
}

export const ChatInput = ({ onSend, isLoading, alias }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
    <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-2">
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
          placeholder="¡Cuéntame qué se te antoja! 🍽️"
          className="w-full rounded-2xl bg-white/80 dark:bg-[#0f1b1a]/80 backdrop-blur-sm border border-[#c7f0ec]/50 px-4 py-2.5 text-sm text-[#111111] dark:text-white placeholder-[#111111]/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#1ce3cf]/50 transition-all duration-200 disabled:opacity-50"
          disabled={isLoading}
          aria-label="Mensaje"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
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
