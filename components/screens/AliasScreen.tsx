"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { useTableCodeValidation } from '@/hooks/useTableCodeValidation'
import { CodeValidationLoader } from '@/components/ui/code-validation-loader'
import { CodeValidationError } from '@/components/ui/code-validation-error'
import { TableInfo } from '@/components/ui/table-info'

// Generar un alias aleatorio
function generateRandomAlias(): string {
  const adjectives = ['Gourmet', 'Foodie', 'Sibarita', 'Chef', 'Gourmetón', 'Comensal'];
  const nouns = ['Feliz', 'Hambriento', 'Curioso', 'Elegante', 'Exigente', 'Aventurero'];
  const number = Math.floor(1000 + Math.random() * 9000);
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${randomAdjective}${randomNoun}${number}`;
}

export default function AliasScreen() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [code, setCode] = useState<string | null>(null)
  const [alias, setAlias] = useState<string>('')
  
  // Obtener el código de la URL
  useEffect(() => {
    const urlCode = searchParams.get('code')
    setCode(urlCode)
    
    // Generar un alias aleatorio
    setAlias(generateRandomAlias())
  }, [searchParams])
  
  // Usar nuestro hook personalizado para validar el código
  const { isLoading, isValid, tableData, error } = useTableCodeValidation(code)
  
  // Manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid || !code) {
      toast({
        title: "Código no válido",
        description: "No se puede continuar con un código de mesa inválido.",
        variant: "destructive",
      })
      return
    }
    
    if (!alias.trim()) {
      toast({
        title: "Alias requerido",
        description: "Por favor, introduce un alias o usa el generado automáticamente.",
        variant: "destructive",
      })
      return
    }
    
    // Guardar el alias en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('gourmeton_client_alias', alias.trim())
    }
    
    // Redirigir al menú
    router.push('/menu')
  }
  
  // Manejar el reintento de validación
  const handleRetry = () => {
    const urlCode = searchParams.get('code')
    setCode(urlCode)
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#f8fbfb] group/design-root overflow-x-hidden" style={{ fontFamily: 'Epilogue, "Noto Sans", sans-serif' }}>
      <div className="flex w-full grow bg-[#f8fbfb] @container p-4">
        <div className="w-full gap-1 overflow-hidden bg-[#f8fbfb] @[480px]:gap-2 aspect-[3/2] rounded-xl flex">
          <div
            className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-none flex-1"
            style={{ backgroundImage: 'url("https://cdn.usegalileo.ai/sdxl10/36e7e026-ee59-417b-aa5a-9480957baf30.png")' }}
          />
        </div>
      </div>
      <div className="flex w-full grow bg-[#f8fbfb] p-4 flex-col">
        <motion.div 
          className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CodeValidationLoader message="Verificando código de mesa..." />
              </motion.div>
            )}
            
            {!isLoading && !isValid && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CodeValidationError 
                  error={error.message || "No se pudo validar el código de mesa."}
                  onRetry={handleRetry}
                />
              </motion.div>
            )}
            
            {!isLoading && isValid && tableData && (
              <motion.div
                key="valid"
                className="flex flex-col items-center w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <TableInfo 
                  tableNumber={tableData.table_number} 
                />
                
                <motion.div
                  className="w-full mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-[#0e1b19] text-2xl font-bold text-center mb-2">
                    ¿Cómo quieres que te llamemos?
                  </h1>
                  <p className="text-gray-600 text-center text-sm mb-6">
                    Usar un alias nos ayuda a servirte mejor. Tu nombre aparecerá en tus platos.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="w-full px-4 py-3 h-14 text-[#0e1b19] bg-white border border-[#d0e6e4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1ce3cf] focus:border-transparent placeholder-[#4f968f]"
                        placeholder="Tu alias"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        Usa el alias sugerido o escribe uno propio.
                      </p>
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full h-14 rounded-full bg-[#1ce3cf] text-[#0e1b19] hover:bg-[#1ce3cf]/90 text-base"
                    >
                      Continuar al menú
                    </Button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
} 