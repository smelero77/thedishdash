"use client"

import React, { Suspense } from 'react'
import AliasScreen from '@/components/screens/AliasScreen'
import LoadingScreen from '@/components/screens/MenuScreen/LoadingScreen'

export default function AliasPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AliasScreen />
    </Suspense>
  );
} 