"use client"

import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface LoadingScreenProps {
  message?: string;
  showAnimation?: boolean;
  className?: string;
}

export function LoadingScreen({ 
  message = 'Cargando...',
  showAnimation = true,
  className = ''
}: LoadingScreenProps) {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-[#f8fbfb] ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {showAnimation && (
          <div className="w-32 h-32">
            <DotLottieReact
              src="https://lottie.host/4ed7bf92-15ef-455a-8326-4b24d2ffac1e/GGQCg185BX.lottie"
              loop
              autoplay
            />
          </div>
        )}
        <p 
          className="text-[#0e1b19] text-lg font-medium" 
          style={{ fontFamily: 'Epilogue, "Noto Sans", sans-serif' }}
        >
          {message}
        </p>
      </div>
    </div>
  )
} 