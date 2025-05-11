import { ChatMessageProps, AssistantResponse } from './types';

function getInitials(name: string) {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (name[0] + (name[1] || name[0])).toUpperCase();
}

function renderContent(content: string | AssistantResponse) {
  if (typeof content === 'string') {
    return <p className="text-sm leading-relaxed">{content}</p>;
  }

  switch (content.type) {
    case 'assistant_text':
      return <p className="text-sm leading-relaxed">{content.content}</p>;
    case 'recommendations':
      return (
        <div className="space-y-2">
          {content.data.map((rec: any, index: number) => (
            <div key={index} className="bg-white/10 rounded-lg p-2">
              <p className="font-bold">{rec.name}</p>
              <p className="text-sm">{rec.description}</p>
              <p className="text-sm text-[#1ce3cf]">{rec.price}€</p>
            </div>
          ))}
        </div>
      );
    case 'product_details':
      return (
        <div className="space-y-2">
          <div className="bg-white/10 rounded-lg p-2">
            <p className="font-bold">{content.data.item.name}</p>
            <p className="text-sm">{content.data.explanation}</p>
            <p className="text-sm text-[#1ce3cf]">{content.data.item.price}€</p>
          </div>
        </div>
      );
    default:
      return <p className="text-sm leading-relaxed">Lo siento, no pude procesar esta respuesta.</p>;
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