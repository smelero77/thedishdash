import { ChatSession } from './ChatSession';
import { Message } from './Message';
import { MenuItem } from './MenuItem';
import { MenuCombo } from './MenuCombo';

export interface AssistantResponse {
  session: ChatSession;
  message: Message;
  recommendations: MenuItem[];
  combos: MenuCombo[];
} 