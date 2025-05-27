'use client';

import React from 'react';
import { useOrientation } from '@/hooks/useOrientation';
import { Smartphone } from 'lucide-react';

interface OrientationMessageProps {
  title?: string;
  messageLine1?: string;
  messageLine2?: string;
  icon?: React.ReactNode;
}

export function OrientationMessage({
  title = 'Visualización Óptima en Vertical',
  messageLine1 = 'Para asegurar la mejor experiencia de usuario,',
  messageLine2 = 'por favor, rote su dispositivo a la posición vertical.',
  icon = <Smartphone size={48} strokeWidth={1.5} className="text-[#1ce3cf]" />,
}: OrientationMessageProps) {
  const isLandscape = useOrientation();

  if (!isLandscape) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0e1b19]/95 flex flex-col justify-center items-center p-5 text-center">
      <div className="mb-6 p-4 bg-white/10 rounded-full">{icon}</div>
      <h2 className="text-[clamp(1.25rem,5vw,1.75rem)] font-semibold mb-3 text-white">{title}</h2>
      <p className="text-[clamp(0.875rem,3.5vw,1rem)] leading-relaxed max-w-[90%] mx-auto text-white/90">
        {messageLine1}
        <br />
        {messageLine2}
      </p>
    </div>
  );
}
