import { TypedAssistantResponse } from './ChatMessage';

export interface Message {
  id: string;
  content: string | TypedAssistantResponse;
  role: 'guest' | 'assistant';
  timestamp: Date;
}

export interface ChatIAProps {
  isOpen: boolean;
  onClose: () => void;
  userAlias?: string;
}

export interface ChatMessageProps {
  message: Message;
  alias: string;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  alias: string;
} 