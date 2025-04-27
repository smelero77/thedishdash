"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TransitionScreen from './TransitionScreen'
import { AliasModal } from '@/components/ui/AliasModal'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { motion } from 'framer-motion'
import { useTableCodeValidation } from '@/hooks/useTableCodeValidation'
import { useCustomer } from '@/context/CustomerContext'
import { useTable } from '@/context/TableContext'

// Componente personalizado para Lottie con log
interface LoggedLottieProps {
  name: string
  src: string
  loop?: boolean
  autoplay?: boolean
  [key: string]: any
}

const LoggedLottie = ({ name, src, ...props }: LoggedLottieProps) => {
  const isInitialRender = useRef(true)
  
  useEffect(() => {
    if (isInitialRender.current) {
      console.log(`🔄 CARGANDO LOTTIE: ${name}`)
      isInitialRender.current = false
      return () => console.log(`🛑 DESCARGANDO LOTTIE: ${name}`)
    }
  }, [name])

  return <DotLottieReact src={src} {...props} />
}

export default function StartScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showTransition, setShowTransition] = useState(false)
  const [showAliasModal, setShowAliasModal] = useState(false)
  const [nextRoute, setNextRoute] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<'initial' | 'validating' | 'transition' | 'modal' | 'saving'>('initial')
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)
  const [showQRLottie, setShowQRLottie] = useState(false)
  const { validateCode, isValidating, error } = useTableCodeValidation()
  const { saveAlias, isLoading: isSavingAlias } = useCustomer()
  const { tableNumber } = useTable()

  // Efecto para controlar la visualización del Lottie QR
  useEffect(() => {
    if (backgroundLoaded) {
      const timer = setTimeout(() => {
        setShowQRLottie(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [backgroundLoaded])

  useEffect(() => {
    const imageLoader = new Image()
    imageLoader.src = "https://cdn.usegalileo.ai/sdxl10/36e7e026-ee59-417b-aa5a-9480957baf30.png"
    imageLoader.onload = () => {
      console.log('🖼️ FONDO CARGADO')
      setBackgroundLoaded(true)
    }
    
    const timer = setTimeout(() => {
      if (!backgroundLoaded) {
        console.log('🖼️ FONDO CARGADO (TIMEOUT)')
        setBackgroundLoaded(true)
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [backgroundLoaded])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code) {
      handleValidateCode(code)
    }
  }, [])

  // Actualizar el estado de carga cuando cambien los estados
  useEffect(() => {
    if (isSavingAlias) {
      setLoadingState('saving')
    } else if (showTransition) {
      setLoadingState('transition')
    } else if (showAliasModal) {
      setLoadingState('modal')
    } else if (isValidating) {
      setLoadingState('validating')
    } else {
      setLoadingState('initial')
    }
  }, [isValidating, showTransition, showAliasModal, isSavingAlias])

  const handleValidateCode = async (code: string) => {
    console.log('[StartScreen] Validando código:', { code })
    setShowQRLottie(false)
    
    const { table, error: validationError } = await validateCode(code)
    console.log('[StartScreen] Resultado validación:', { table, validationError })
    
    if (validationError) {
      console.log('[StartScreen] Error de validación:', validationError)
      setNextRoute('invalid')
      setShowTransition(true)
      return
    }

    if (!table) {
      console.log('[StartScreen] No se encontró la mesa')
      setNextRoute('invalid')
      setShowTransition(true)
      return
    }

    console.log('[StartScreen] Código válido, mostrando transición')
    setNextRoute('valid')
    setShowTransition(true)
  }

  const handleTransitionComplete = () => {
    console.log('[StartScreen] Transición completada:', { nextRoute })
    
    if (nextRoute === 'valid') {
      console.log('[StartScreen] Mostrando modal de alias')
      setShowTransition(false)
      setTimeout(() => {
        console.log('[StartScreen] Abriendo modal después del timeout')
        setShowAliasModal(true)
      }, 100)
    } else {
      console.log('[StartScreen] Navegando a invalid')
      router.replace('/invalid')
    }
  }

  const handleAliasConfirm = async (alias: string): Promise<boolean> => {
    console.log('[StartScreen] Alias confirmado:', { alias })
    setLoadingState('saving')
    
    const success = await saveAlias(alias)
    console.log('[StartScreen] Resultado guardado:', { success })
    
    if (success) {
      console.log('[StartScreen] Navegando a menu')
      const code = searchParams.get('code')
      router.push(`/menu?code=${code}`)
      return true
    }
    return false
  }

  // Efecto para actualizar el estado de carga
  useEffect(() => {
    console.log('[StartScreen] Estado actualizado:', { 
      isValidating, 
      showTransition, 
      showAliasModal, 
      nextRoute, 
      loadingState, 
      backgroundLoaded, 
      showQRLottie,
      isSavingAlias
    })
  }, [isValidating, showTransition, showAliasModal, nextRoute, loadingState, backgroundLoaded, showQRLottie, isSavingAlias])

  const renderContent = () => {
    if (showTransition) {
      return <TransitionScreen onComplete={handleTransitionComplete} />
    }
    
    return (
      <div className="flex flex-col items-center justify-center grow relative z-10">
        {showQRLottie && (
          <motion.div 
            className="w-28 h-28"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoggedLottie
              name="LOTTIE_QR"
              src="https://lottie.host/64d2a522-5b74-4170-867f-5325128d3d8e/6M1Hh4xBSr.lottie"
              loop
              autoplay
            />
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-black group/design-root overflow-hidden">
      {/* Imagen de fondo con filtro */}
      <div className="absolute inset-0 z-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full bg-center bg-no-repeat bg-cover mix-blend-overlay brightness-75"
          style={{ backgroundImage: 'url("https://cdn.usegalileo.ai/sdxl10/36e7e026-ee59-417b-aa5a-9480957baf30.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
      </div>

      {renderContent()}

      <AliasModal
        isOpen={showAliasModal}
        onClose={() => setShowAliasModal(false)}
        onConfirm={handleAliasConfirm}
      />
    </div>
  )
}