export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatIAProps {
  isOpen: boolean;
  onClose: () => void;
  alias?: string;
}

export interface ChatMessageProps {
  message: Message;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
} 