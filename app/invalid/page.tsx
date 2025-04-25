"use client"

import React, { Suspense } from 'react'
import InvalidScreen from '@/components/screens/InvalidScreen'
import LoadingScreen from '@/components/screens/MenuScreen/LoadingScreen'

export default function InvalidPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <InvalidScreen />
    </Suspense>
  );
} 