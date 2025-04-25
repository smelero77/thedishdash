import { useState, useEffect, useRef } from 'react'

const ALIAS_STORAGE_KEY = 'gourmeton_client_alias'

export const useCustomerAlias = () => {
  const [alias, setAlias] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Load alias from localStorage on mount
    const loadAlias = () => {
      // Asegurarse de que estamos en el cliente antes de acceder a localStorage
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }
      
      try {
        const storedAlias = localStorage.getItem(ALIAS_STORAGE_KEY)
        if (storedAlias) {
          setAlias(storedAlias)
        }
      } catch (error) {
        console.error('Error loading alias:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (isInitialMount.current) {
      loadAlias()
      isInitialMount.current = false
    }
  }, [])

  const saveAlias = async (newAlias: string) => {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      return false
    }
    
    try {
      localStorage.setItem(ALIAS_STORAGE_KEY, newAlias)
      setAlias(newAlias)
      return true
    } catch (error) {
      console.error('Error saving alias:', error)
      return false
    }
  }

  const clearCustomerAlias = () => {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      return
    }
    
    localStorage.removeItem(ALIAS_STORAGE_KEY)
    setAlias(null)
  }

  return {
    alias,
    isLoading,
    saveAlias,
    clearCustomerAlias
  }
} 