'use client';

import React from 'react';

interface ChatButtonProps {
  onClick: () => void;
}

export default function ChatButton({ onClick }: ChatButtonProps) {
  return (
    <svg
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      className="cursor-pointer active:scale-95 touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <defs>
        <linearGradient id="chat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1ce3cf" className="animate-gradient-1" />
          <stop offset="20%" stopColor="#1ce3cf" className="animate-gradient-2" />
          <stop offset="40%" stopColor="#9ca3af" className="animate-gradient-3" />
          <stop offset="60%" stopColor="#9ca3af" className="animate-gradient-4" />
          <stop offset="80%" stopColor="#1ce3cf" className="animate-gradient-5" />
          <stop offset="100%" stopColor="#1ce3cf" className="animate-gradient-6" />
        </linearGradient>
      </defs>

      {/* Silueta del sombrero con degradado en el stroke */}
      <path
        d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"
        stroke="url(#chat-gradient)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 17h12"
        stroke="url(#chat-gradient)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
