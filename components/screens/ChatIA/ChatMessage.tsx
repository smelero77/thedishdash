import { ChatMessageProps } from './types';
import { AssistantResponse } from '@/lib/chat/types/response.types';
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
  };
}

export interface RecommendationsResponse {
  type: 'recommendations';
  data: Recommendation[];
}

export interface TextResponse {
  type: string;
  content: string;
}

export type TypedAssistantResponse = 
  | RecommendationsResponse
  | ClarificationResponse
  | ErrorResponse
  | TextResponse;

function getInitials(name: string) {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (name[0] + (name[1] || name[0])).toUpperCase();
}

function renderContent(content: string | TypedAssistantResponse): ReactNode {
  if (typeof content === 'string') {
    return <p className="text-sm leading-relaxed">{content}</p>;
  }

  switch (content.type) {
    case 'recommendations': {
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
      return <p className="text-sm leading-relaxed">{text.content}</p>;
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