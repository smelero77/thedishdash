"use client"

import MenuScreen from '@/components/screens/MenuScreen'
import { useTableValidation } from '@/hooks/useTableValidation'

export function MenuPageContent() {
  const { isValidating, tableNumber } = useTableValidation()

  if (isValidating) {
    return null
  }

  if (!tableNumber) {
    return null
  }

  return <MenuScreen initialTableNumber={tableNumber} />
} 