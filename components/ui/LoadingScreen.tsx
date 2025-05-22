'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#f8fbfb]"
      suppressHydrationWarning
    >
      <div className="flex flex-col items-center gap-4" suppressHydrationWarning>
        <div className="w-32 h-32" suppressHydrationWarning>
          <Loader2 className="w-full h-full animate-spin text-primary" />
        </div>
        {message && (
          <p className="text-lg text-gray-600" suppressHydrationWarning>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
