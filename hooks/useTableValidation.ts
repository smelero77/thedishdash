import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { validateTableCode } from '@/lib/data'

export function useTableValidation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isValidating, setIsValidating] = useState(true)
  const [tableNumber, setTableNumber] = useState<string | null>(null)

  useEffect(() => {
    async function validate() {
      try {
        const urlCode = searchParams.get('code')
        const storedCode = localStorage.getItem('tableCode')
        const storedTableNumber = localStorage.getItem('tableNumber')
        const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID()

        // Si no hay código en la URL, usar el almacenado
        const codeToValidate = urlCode || storedCode
        if (!codeToValidate) {
          throw new Error('No code provided')
        }

        // Validar el código
        const { table } = await validateTableCode(codeToValidate, deviceId)

        // Almacenar datos
        localStorage.setItem('tableCode', codeToValidate)
        localStorage.setItem('tableNumber', table.table_number.toString())
        localStorage.setItem('deviceId', deviceId)

        setTableNumber(table.table_number.toString())
        router.push('/menu')
      } catch (error) {
        console.error('[useTableValidation] Validation error:', error)
        localStorage.removeItem('tableCode')
        localStorage.removeItem('tableNumber')
        router.push('/error')
      } finally {
        setIsValidating(false)
      }
    }

    validate()
  }, [router, searchParams])

  return { isValidating, tableNumber }
} 