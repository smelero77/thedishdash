'use client';

import { useState, useCallback } from 'react';

export function useTypingIndicator() {
  const [isTyping, setIsTyping] = useState(false);

  const startTyping = useCallback(() => {
    setIsTyping(true);
  }, []);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
  }, []);

  return {
    isTyping,
    startTyping,
    stopTyping
  };
} 