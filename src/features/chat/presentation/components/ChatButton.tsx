'use client';

import React from 'react';
import { ChefHat } from 'lucide-react';

interface ChatButtonProps {
  onClick: () => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick }) => {
  return (
    <>
      <button
        onClick={onClick}
        className="group h-[48px] w-[48px] flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] backdrop-blur-md bg-opacity-90 text-white shadow-[0_4px_12px_rgba(14,165,233,0.3)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.5)] active:scale-95 active:shadow-[0_2px_8px_rgba(14,165,233,0.2)] transition-all duration-300 ease-out relative overflow-hidden before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:translate-x-[-100%] before:animate-[shine_3s_ease-in-out_infinite] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-white/30 after:to-transparent after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-300 hover:scale-105 hover:rotate-3 active:scale-95 active:rotate-0 border border-white/20 hover:border-white/40"
      >
        <div className="relative">
          <ChefHat className="h-5 w-5 relative z-10 text-white" />
          <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-[pulse_2s_ease-in-out_infinite]" />
          <div className="absolute -inset-1 bg-gradient-to-r from-[#0ea5e9] via-[#0284c7] to-[#0369a1] rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Particle effects */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-[particle1_3s_ease-in-out_infinite]" />
            <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-[particle2_4s_ease-in-out_infinite]" />
            <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-[particle3_5s_ease-in-out_infinite]" />
            <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-[particle4_3.5s_ease-in-out_infinite]" />
            <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-[particle5_4.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </button>

      <style jsx global>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes particle1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
          25% { transform: translate(10px, -10px) scale(1.5); opacity: 0.8; }
          50% { transform: translate(20px, 0) scale(1); opacity: 0; }
          75% { transform: translate(10px, 10px) scale(1.5); opacity: 0.8; }
        }
        @keyframes particle2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
          25% { transform: translate(-10px, -10px) scale(1.5); opacity: 0.8; }
          50% { transform: translate(-20px, 0) scale(1); opacity: 0; }
          75% { transform: translate(-10px, 10px) scale(1.5); opacity: 0.8; }
        }
        @keyframes particle3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
          25% { transform: translate(10px, 10px) scale(1.5); opacity: 0.8; }
          50% { transform: translate(0, 20px) scale(1); opacity: 0; }
          75% { transform: translate(-10px, 10px) scale(1.5); opacity: 0.8; }
        }
        @keyframes particle4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
          25% { transform: translate(-10px, 10px) scale(1.5); opacity: 0.8; }
          50% { transform: translate(0, -20px) scale(1); opacity: 0; }
          75% { transform: translate(10px, -10px) scale(1.5); opacity: 0.8; }
        }
        @keyframes particle5 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
          25% { transform: translate(15px, 0) scale(1.5); opacity: 0.8; }
          50% { transform: translate(0, 15px) scale(1); opacity: 0; }
          75% { transform: translate(-15px, 0) scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </>
  );
};

export default ChatButton; 