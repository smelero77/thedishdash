import { ChatMessageProps } from './types';
import { AssistantResponse, Recommendation } from '@/lib/chat/types/response.types';
import { SYSTEM_MESSAGE_TYPES } from '@/lib/chat/constants/config';
import { ReactNode } from 'react';

function getInitials(name: string) {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (name[0] + (name[1] || name[0])).toUpperCase();
}

function renderContent(content: string | AssistantResponse): ReactNode {
  if (typeof content === 'string') {
    return <p className="text-sm leading-relaxed">{content}</p>;
  }

  const recommendations = content.recommendations || [];
  const clarificationPoints = content.clarification_points || [];

  switch (content.type) {
    case SYSTEM_MESSAGE_TYPES.RECOMMENDATION:
      return (
        <div className="space-y-2">
          {recommendations.map((rec: Recommendation, index: number) => (
            <div key={index} className="bg-white/10 rounded-lg p-2">
              <p className="font-bold">{rec.menu_item_id}</p>
              <p className="text-sm">{rec.reason}</p>
              <p className="text-sm text-[#1ce3cf]">Match: {Math.round(rec.match_score * 100)}%</p>
            </div>
          ))}
          <p className="text-sm leading-relaxed">{content.content}</p>
        </div>
      );
    case SYSTEM_MESSAGE_TYPES.CLARIFICATION:
      return (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">{content.content}</p>
          {clarificationPoints.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-semibold">Puedes:</p>
              <ul className="list-disc list-inside text-sm">
                {clarificationPoints.map((point: string, index: number) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    case SYSTEM_MESSAGE_TYPES.ERROR:
      return (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-red-500">{content.content}</p>
          {content.error && content.error.message && (
            <p className="text-xs text-red-400">Error: {content.error.message}</p>
          )}
        </div>
      );
    default:
      return <p className="text-sm leading-relaxed">{content.content}</p>;
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