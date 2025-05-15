export interface AssistantResponse {
  sessionId: string;
  message: string;
  recommendations?: string[];
  combos?: string[];
} 