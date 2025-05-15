import { TimeOfDay } from './TimeOfDay';

export interface ChatSession {
  id: string;
  clienteId: string;
  aliasMesa: string;
  startedAt: Date;
  lastActive: Date;
  systemContext: string;
  timeOfDay: TimeOfDay;
}

export interface Message {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface AssistantResponse {
  type: 'assistant_text' | 'assistant_menu' | 'assistant_error';
  data: {
    text?: string;
    menuItems?: MenuItem[];
    error?: string;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryIds: string[];
  isAvailable: boolean;
  isRecommended?: boolean;
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  extraPrice: number;
  isDefault: boolean;
}

export interface WeatherContext {
  temperature: number;
  condition: string;
  icon: string;
}

export interface MessageContext {
  weather?: WeatherContext;
  timeOfDay: TimeOfDay;
  previousMessages: Message[];
  currentSlot?: string;
}

export interface Slot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface ChatMessageProps {
  message: Message;
  isLastMessage: boolean;
  onRetry?: () => void;
}

export interface MenuCombo {
  id: string;
  mainItem: MenuItem;
  suggestedItems: MenuItem[];
  totalPrice: number;
}

export * from './TimeOfDay'; 