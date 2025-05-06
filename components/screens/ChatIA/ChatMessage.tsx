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
    <div className={`flex w-full mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar izquierda para asistente */}
      {!isUser && (
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white text-xl mr-2">
          👨‍🍳
        </span>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 relative overflow-hidden ${
          isUser
            ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 text-white'
            : 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 text-white'
        }`}
      >
        {!isUser && (
          <div className="text-sm font-bold mb-1 text-blue-400">
            Don Gourmetón
          </div>
        )}
        <p className="text-sm">{message.content}</p>
        <span className="mt-1 block text-xs text-gray-400">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      {/* Avatar derecha para usuario */}
      {isUser && (
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 text-white text-base ml-2">
          {getInitials(alias)}
        </span>
      )}
    </div>
  );
}; 