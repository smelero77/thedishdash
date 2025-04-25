"use client"

import * as React from "react"
import { Suspense } from 'react'
import StartScreen from "@/components/screens/StartScreen"
import { LoadingFallback } from "@/components/ui/loading-fallback"

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StartScreen />
    </Suspense>
  )
} 