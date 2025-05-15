import { AssistantResponse } from '../entities/AssistantResponse';
import { Filters } from '../entities/Filters';

export interface OpenAIClient {
  // Generación de respuestas
  generateResponse(messages: any[]): Promise<any>; // TODO: Definir tipo para mensajes
  
  // Análisis de consultas
  analyzeUserQuery(message: string): Promise<Filters>;
} 