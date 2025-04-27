import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[#0e1b19]">{message}</p>
    </div>
  );
};

export default LoadingScreen; 