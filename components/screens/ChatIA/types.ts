import { AssistantResponse as BackendAssistantResponse } from '@/lib/chat/types/response.types';

export interface Message {
  id: string;
  content: string | BackendAssistantResponse;
  role: 'guest' | 'assistant';
  timestamp: Date;
}

export interface ChatIAProps {
  isOpen: boolean;
  onClose: () => void;
  alias?: string;
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