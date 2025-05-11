import { MenuItem } from '../../types/menu';

export interface ChatSession {
  id: string;
  userAlias: string;
  systemContext: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

export interface MessageContext {
  timeOfDay: string;
  categoryId?: string;
  similarItems?: MenuItem[];
} 