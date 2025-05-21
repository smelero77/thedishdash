import React from 'react';
import { ChefHat } from 'lucide-react';

interface ChatButtonProps {
  onClick: () => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white before:absolute before:inset-[-1px] before:rounded-full before:bg-gradient-to-r before:from-red-500/40 before:via-yellow-500/40 before:via-green-500/40 before:via-blue-500/40 before:via-purple-500/40 before:to-red-500/40 before:blur-[2px] before:-z-10 before:animate-gradient-x active:scale-95 touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <ChefHat size={24} color="#4f968f" />
    </button>
  );
};

export default ChatButton;
