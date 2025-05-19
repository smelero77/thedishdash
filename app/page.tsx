'use client';

import * as React from 'react';
import { Suspense } from 'react';
import StartScreen from '@/components/screens/StartScreen';
import { LoadingScreen } from '../components/ui/LoadingScreen';

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <StartScreen />
    </Suspense>
  );
}
