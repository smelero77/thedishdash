'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function InvalidScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-black group/design-root overflow-hidden"
      style={{ fontFamily: 'Epilogue, "Noto Sans", sans-serif' }}
    >
      {/* Imagen de fondo con filtro */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-center bg-no-repeat bg-cover mix-blend-overlay brightness-75"
          style={{
            backgroundImage:
              'url("https://cdn.usegalileo.ai/sdxl10/36e7e026-ee59-417b-aa5a-9480957baf30.png")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
      </div>

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
            <div className="w-32 h-32">
              <DotLottieReact
                src="https://lottie.host/77ca70af-304a-41fe-af42-d22b1da5223c/KIKWRiH5BA.lottie"
                loop
                autoplay
              />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-3">Código QR inválido</h1>
              <p className="text-gray-200 text-lg mb-2">
                Cierra esta pestaña del navegador y vuelve a escanear el código QR de tu mesa.
              </p>
              <p className="text-[#1ce3cf] text-xl font-semibold">¡Te estamos esperando!</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
