'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface TransitionScreenProps {
  onComplete: () => void;
}

export default function TransitionScreen({ onComplete }: TransitionScreenProps) {
  const [text, setText] = useState('');
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const fullText = 'Preparando tu experiencia';

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // 4 segundos

    // Efecto de escritura
    let currentIndex = 0;
    const textInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(textInterval);
      }
    }, 100);

    // Precargar la imagen de fondo
    const imageLoader = new Image();
    imageLoader.src = 'https://cdn.usegalileo.ai/sdxl10/36e7e026-ee59-417b-aa5a-9480957baf30.png';
    imageLoader.onload = () => setBackgroundLoaded(true);

    return () => {
      clearTimeout(timer);
      clearInterval(textInterval);
      imageLoader.onload = null;
    };
  }, [onComplete]);

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-black group/design-root overflow-hidden"
      style={{ fontFamily: 'Epilogue, "Noto Sans", sans-serif' }}
    >
      {/* Imagen de fondo con filtro */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: backgroundLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="w-full h-full bg-center bg-no-repeat bg-cover mix-blend-overlay brightness-75"
          style={{
            backgroundImage:
              'url("https://cdn.usegalileo.ai/sdxl10/36e7e026-ee59-417b-aa5a-9480957baf30.png")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
      </motion.div>

      <div className="flex flex-col items-center pt-16 pb-8 relative z-10">
        <motion.h2
          className="text-white text-5xl font-black leading-none tracking-tight text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          BIENVENID@S
        </motion.h2>
        <motion.h3
          className="text-[#1ce3cf] text-4xl font-extrabold leading-tight tracking-tight text-center mt-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          EL GOURMETON
        </motion.h3>
      </div>

      <div className="flex w-full grow px-4 py-8 flex-col items-center justify-center relative z-10">
        <motion.div
          className="max-w-md w-full p-8 bg-white/25 backdrop-blur-md rounded-3xl border border-white/30 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="w-64 h-64">
              <DotLottieReact
                src="https://lottie.host/64d2a522-5b74-4170-867f-5325128d3d8e/6M1Hh4xBSr.lottie"
                loop
                autoplay
                speed={0.5}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <motion.p
              className="text-[#1ce3cf] text-xl font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {text}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
