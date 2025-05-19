import React from 'react';

interface ErrorScreenProps {
  error: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500">Error: {error}</p>
    </div>
  );
};

export default ErrorScreen;
