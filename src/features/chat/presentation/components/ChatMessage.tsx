import React from 'react';
import { ChefHat } from 'lucide-react';
import { format } from 'date-fns';
import { ChatMessageProps, AssistantResponse } from '@/lib/chat/types';
import { RecommendationCard } from './RecommendationCard';
import { MenuComboCard } from './MenuComboCard';
import { CartActionsContext } from '@/context/CartActionsContext';
import { Message } from '../../domain/entities/Message';

export interface ChatMessageProps {
  message: Message;
  isLastMessage: boolean;
  onRetry?: () => void;
  onViewDetails?: (itemId: string) => void;
}

export function ChatMessage({
  message,
  isLastMessage,
  onRetry,
  onViewDetails
}: ChatMessageProps) {
  const cartActions = React.useContext(CartActionsContext);
  const isUser = message.role === 'user';

  // Función para obtener las dos primeras letras del alias
  const getInitials = (alias: string) => {
    return alias
      .slice(0, 2)
      .toUpperCase();
  };

  // Selector de contenido
  const renderContent = () => {
    if (!message.content) return null;

    switch (message.content.type) {
      case 'user_text':
      case 'assistant_text':
        return (
          <div className={`
            text-sm p-3 rounded-xl max-w-[80%] self-start
            ${isUser 
              ? 'bg-[#1ce3cf] text-white rounded-tr-none self-end' 
              : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-tl-none self-start'}
          `}>
            {message.content.data.text}
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-4">
            {message.content.data.recommendations?.map(item => (
              <RecommendationCard
                key={item.id}
                item={item}
                onViewDetails={onViewDetails}
                onAddToCart={cartActions?.handleAddToCart}
              />
            ))}
          </div>
        );

      case 'combo_recommendations':
        return (
          <div className="space-y-4">
            {message.content.data.recommendations?.map((combo, i) => (
              <MenuComboCard
                key={i}
                combo={combo}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        );

      case 'product_details':
        return (
          <>
            <p className="mb-2">{message.content.data.explanation}</p>
            <RecommendationCard
              item={message.content.data.item!}
              onViewDetails={onViewDetails}
              onAddToCart={cartActions?.handleAddToCart}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center 
        ${isUser ? 'bg-[#1ce3cf] text-white' : 'bg-[#1ce3cf] text-white'}`}>
        {isUser ? getInitials(message.alias || 'Cl') : <ChefHat className="h-6 w-6" />}
      </div>

      {/* Burbuja */}
      <div className="flex flex-col max-w-[70%]">
        {renderContent()}
        <span className={`text-xs mt-1 ${isUser ? 'text-[#1ce3cf] self-end' : 'text-[#1ce3cf] self-start'}`}>
          {format(message.timestamp, 'HH:mm')}
        </span>
      </div>
    </div>
  );
}