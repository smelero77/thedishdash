import { AssistantResponse } from '@/lib/chat/types/response.types';
import { Recommendations } from './Recommendations';
import { ProductDetail } from './ProductDetail';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string | AssistantResponse;
  onViewDetails: (productId: string) => void;
}

export function ChatMessage({ role, content, onViewDetails }: ChatMessageProps) {
  const isUser = role === 'user';
  const messageClass = isUser ? 'bg-blue-100 ml-auto' : 'bg-gray-100';

  if (isUser) {
    return (
      <div className={`max-w-[80%] p-3 rounded-lg ${messageClass}`}>
        <p className="text-gray-800">{content}</p>
      </div>
    );
  }

  // Si es un mensaje del asistente, verificar el tipo de contenido
  if (typeof content === 'string') {
    return (
      <div className={`max-w-[80%] p-3 rounded-lg ${messageClass}`}>
        <p className="text-gray-800">{content}</p>
      </div>
    );
  }

  // Manejar diferentes tipos de respuestas del asistente
  switch (content.type) {
    case "assistant_text":
      return (
        <div className={`max-w-[80%] p-3 rounded-lg ${messageClass}`}>
          <p className="text-gray-800">{content.content}</p>
        </div>
      );

    case "recommendations":
      return (
        <div className={`max-w-[80%] p-3 rounded-lg ${messageClass}`}>
          <Recommendations 
            recommendations={content.data} 
            onViewDetails={onViewDetails} 
          />
        </div>
      );

    case "product_details":
      return (
        <div className={`max-w-[80%] p-3 rounded-lg ${messageClass}`}>
          <ProductDetail {...content.data} />
        </div>
      );

    default:
      return (
        <div className={`max-w-[80%] p-3 rounded-lg ${messageClass}`}>
          <p className="text-gray-800">Tipo de respuesta no reconocido</p>
        </div>
      );
  }
} 