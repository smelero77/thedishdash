export type MessageSender = 'user' | 'assistant' | 'staff';

export interface Message {
  id: string;
  role: MessageSender;
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  customerId: string;
  tableNumber: string;
  startedAt: Date;
  lastActive: Date;
  systemContext: string;
  timeOfDay: TimeOfDay;
  isActive: boolean;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface WeatherContext {
  temperature: number;
  condition: string;
  icon: string;
}

export interface MessageContext {
  weather?: WeatherContext;
  timeOfDay?: TimeOfDay;
  customerName?: string;
  tableNumber?: string;
}

export interface AssistantResponse {
  type: 'assistant_text';
  data: {
    text: string;
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