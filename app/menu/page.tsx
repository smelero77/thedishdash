"use client"

import React, { Suspense } from 'react'
import MenuScreen from '@/components/screens/MenuScreen'
import LoadingScreen from '@/components/screens/MenuScreen/LoadingScreen'

export default function MenuPage() {
  const initialTableNumber = 0;
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MenuScreen initialTableNumber={initialTableNumber} />
    </Suspense>
  );
} 