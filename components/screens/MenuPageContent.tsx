"use client"

import { MenuScreenWrapper } from '@/components/screens/MenuScreenWrapper'
import { useTableValidation } from '@/hooks/useTableValidation'
import { useMenuData } from '@/hooks/useMenuData'

export function MenuPageContent() {
  const { isValidating, tableNumber } = useTableValidation()
  const { slots, categories, menuItems, currentSlot } = useMenuData()

  if (isValidating) {
    return null
  }

  if (!tableNumber) {
    return null
  }

  return (
    <MenuScreenWrapper
      initialSlots={slots}
      initialCategories={categories}
      initialMenuItems={menuItems}
      initialCurrentSlot={currentSlot}
    />
  )
} 