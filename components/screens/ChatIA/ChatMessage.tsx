import { ChatMessageProps } from './types';
import { ChatResponse, ProductDetails } from '@/lib/chat/types/response.types';
import { SYSTEM_MESSAGE_TYPES } from '@/lib/chat/constants/config';
import { ReactNode } from 'react';

export interface Recommendation {
  id: string;
  name: string;
  price: number;
  reason: string;
  image_url: string;
  category_info: Array<{
    id: string;
    name: string;
  }>;
}

export interface ClarificationResponse {
  type: typeof SYSTEM_MESSAGE_TYPES.CLARIFICATION;
  content: string;
  clarification_points: string[];
}

export interface ErrorResponse {
  type: typeof SYSTEM_MESSAGE_TYPES.ERROR;
  content: string;
  error: {
    message: string;
    code?: string;
  };
}

export interface RecommendationsResponse {
  type: 'recommendations' | 'recommendation';
  content: string;
  data: Recommendation[];
}

export interface ProductDetailsResponse {
  type: 'product_details';
  content: string;
  product: {
    item: {
      id: string;
      name: string;
      description: string;
      price: number;
      image_url: string;
      category_info: Array<{
        id: string;
        name: string;
      }>;
      food_info?: string;
      origin?: string;
      pairing_suggestion?: string;
      chef_notes?: string;
      calories_est_min?: number;
      calories_est_max?: number;
      is_vegetarian_base?: boolean;
      is_vegan_base?: boolean;
      is_gluten_free_base?: boolean;
    };
    explanation: string;
  };
}

export interface TextResponse {
  type: string;
  content: string;
}

export type TypedAssistantResponse = 
  | { type: 'info'; content: string }
  | { type: 'error'; content: string; error: { message: string } }
  | { type: 'clarification'; content: string }
  | { type: 'recommendations' | 'recommendation'; content: string; data: Recommendation[] }
  | { type: 'product_details'; content: string; product: ProductDetails };

function getInitials(name: string) {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (name[0] + (name[1] || name[0])).toUpperCase();
}

function renderContent(content: string | TypedAssistantResponse): ReactNode {
  if (typeof content === 'string') {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  switch (content.type) {
    case 'recommendations':
    case 'recommendation': {
      const recommendations = content as RecommendationsResponse;
      return (
        <div className="space-y-4">
          {recommendations.data.map((rec: Recommendation) => (
            <div key={rec.id} className="bg-white/10 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {rec.image_url && (
                  <img 
                    src={rec.image_url} 
                    alt={rec.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{rec.name}</h3>
                  <p className="text-sm text-[#1ce3cf]">{rec.price}€</p>
                  <p className="text-sm mt-2">{rec.reason}</p>
                  {rec.category_info?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {rec.category_info.map((cat) => (
                        <span key={cat.id} className="text-xs bg-[#1ce3cf]/20 text-[#1ce3cf] px-2 py-1 rounded">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    case 'product_details': {
      const productDetails = content as ProductDetailsResponse;
      const { item, explanation } = productDetails.product;
      
      return (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-start gap-4">
              {item.image_url && (
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-[#1ce3cf]">{item.price}€</p>
                <p className="text-sm mt-2">{explanation || item.description}</p>
                
                {item.food_info && (
                  <div className="mt-3 text-xs text-white/80 dark:text-white/70">
                    <p>{item.food_info}</p>
                  </div>
                )}
                
                {/* Mostrar etiquetas dietéticas */}
                <div className="flex gap-2 mt-3">
                  {item.is_vegetarian_base && (
                    <span className="text-xs bg-green-600/20 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                      Vegetariano
                    </span>
                  )}
                  {item.is_vegan_base && (
                    <span className="text-xs bg-green-700/20 text-green-700 dark:text-green-500 px-2 py-1 rounded">
                      Vegano
                    </span>
                  )}
                  {item.is_gluten_free_base && (
                    <span className="text-xs bg-yellow-600/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded">
                      Sin Gluten
                    </span>
                  )}
                </div>
                
                {item.category_info?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {item.category_info.map((cat) => (
                      <span key={cat.id} className="text-xs bg-[#1ce3cf]/20 text-[#1ce3cf] px-2 py-1 rounded">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}
                
                {item.calories_est_min && item.calories_est_max && (
                  <p className="text-xs mt-2 text-white/70">
                    Calorías estimadas: {item.calories_est_min}-{item.calories_est_max} kcal
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    case SYSTEM_MESSAGE_TYPES.CLARIFICATION: {
      const clarification = content as ClarificationResponse;
      return (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">{clarification.content}</p>
          {clarification.clarification_points?.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-semibold">Puedes:</p>
              <ul className="list-disc list-inside text-sm">
                {clarification.clarification_points.map((point: string, index: number) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    case SYSTEM_MESSAGE_TYPES.ERROR: {
      const error = content as ErrorResponse;
      return (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-red-500">{error.content}</p>
          {error.error?.message && (
            <p className="text-xs text-red-400">Error: {error.error.message}</p>
          )}
        </div>
      );
    }
    default: {
      const text = content as TextResponse;
      return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text.content}</p>;
    }
  }
}

export const ChatMessage = ({ message, alias }: ChatMessageProps) => {
  const isGuest = message.role === 'guest';

  return (
    <div className={`flex w-full mb-4 ${isGuest ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar izquierda para asistente */}
      {!isGuest && (
        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1ce3cf] text-white text-xl mr-3">
          👨‍🍳
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 relative overflow-hidden ${
          isGuest
            ? 'bg-[#1ce3cf] text-white'
            : 'bg-[#e1fbf7] dark:bg-[#1ce3cf]/10 text-[#111111] dark:text-white'
        }`}
      >
        {!isGuest && (
          <div className="text-sm font-bold mb-1 text-[#1ce3cf] dark:text-[#1ce3cf]">
            Don Gourmetón
          </div>
        )}
        {renderContent(message.content)}
        <span className={`mt-1 block text-xs text-right ${isGuest ? 'text-white/80' : 'text-[#111111]/60 dark:text-white/60'}`}>
          {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {/* Avatar derecha para usuario */}
      {isGuest && (
        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1ce3cf] text-white text-base ml-3">
          {getInitials(alias)}
        </span>
      )}
    </div>
  );
}; 