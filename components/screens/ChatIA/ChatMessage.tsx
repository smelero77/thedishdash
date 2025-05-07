import { ChatMessageProps } from './types';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export const ChatMessage = ({ message, alias }: ChatMessageProps & { alias: string }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar izquierda para asistente */}
      {!isUser && (
        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1ce3cf] text-white text-xl mr-3">
          👨‍🍳
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 relative overflow-hidden ${
          isUser
            ? 'bg-[#1ce3cf] text-white'
            : 'bg-[#e1fbf7] dark:bg-[#1ce3cf]/10 text-[#111111] dark:text-white'
        }`}
      >
        {!isUser && (
          <div className="text-sm font-bold mb-1 text-[#1ce3cf] dark:text-[#1ce3cf]">
            Don Gourmetón
          </div>
        )}
        <p className="text-sm leading-relaxed">{message.content}</p>
        <span className={`mt-1 block text-xs text-right ${isUser ? 'text-white/80' : 'text-[#111111]/60 dark:text-white/60'}`}>
          {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {/* Avatar derecha para usuario */}
      {isUser && (
        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1ce3cf] text-white text-base ml-3">
          {getInitials(alias)}
        </span>
      )}
    </div>
  );
}; 