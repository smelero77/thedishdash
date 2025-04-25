"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import MenuScreen from '@/components/screens/MenuScreen'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function MenuPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isValidating, setIsValidating] = useState(true)
  const [tableNumber, setTableNumber] = useState<number | null>(null)

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // 1. Check URL params first
        const urlCode = searchParams.get('code')
        
        // 2. If no URL code, check localStorage
        const storedCode = localStorage.getItem('gourmeton_table_code')
        const storedTableNumber = localStorage.getItem('gourmeton_table_number')

        // 3. If we have a stored code and no URL code, use stored
        if (!urlCode && storedCode && storedTableNumber) {
          setTableNumber(parseInt(storedTableNumber))
          setIsValidating(false)
          return
        }

        // 4. If we have a URL code, validate it
        if (urlCode) {
          const { data, error } = await supabase
            .from('table_codes')
            .select('table_number')
            .eq('id', urlCode)
            .single()

          if (error || !data) {
            // Clear any stored data
            localStorage.removeItem('gourmeton_table_code')
            localStorage.removeItem('gourmeton_table_number')
            router.replace('/?error=invalid_code')
            return
          }

          // Save valid code and table number
          localStorage.setItem('gourmeton_table_code', urlCode)
          localStorage.setItem('gourmeton_table_number', data.table_number.toString())
          setTableNumber(data.table_number)
          router.replace('/menu')
          return
        }

        // 5. If no code anywhere, redirect to home
        router.replace('/?error=no_code')
      } catch (error) {
        console.error('Error validating access:', error)
        router.replace('/?error=validation_error')
      } finally {
        setIsValidating(false)
      }
    }

    validateAccess()
  }, [router, searchParams])

  if (isValidating) {
    return null
  }

  if (!tableNumber) {
    return null
  }

  return <MenuScreen initialTableNumber={tableNumber} />
} 