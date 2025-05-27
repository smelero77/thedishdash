'use client';

import React, { Suspense } from 'react';
import InvalidScreen from '@/components/screens/InvalidScreen';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function InvalidPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <InvalidScreen />
    </Suspense>
  );
}
