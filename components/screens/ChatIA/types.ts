export interface Message {
  id: string;
  content: string | AssistantResponse;
  role: 'guest' | 'assistant';
  timestamp: Date;
}

export interface AssistantResponse {
  type: 'assistant_text' | 'recommendations' | 'product_details';
  content?: string;
  data?: any;
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