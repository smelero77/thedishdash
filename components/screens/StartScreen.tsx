"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import TransitionScreen from './TransitionScreen'
import { AliasModal } from '@/components/ui/AliasModal'
import { supabase } from '@/lib/supabase/client'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { motion } from 'framer-motion'

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
  const [isValidating, setIsValidating] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [showAliasModal, setShowAliasModal] = useState(false)
  const [nextRoute, setNextRoute] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<'initial' | 'validating' | 'transition' | 'modal'>('initial')
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)
  const [showQRLottie, setShowQRLottie] = useState(false)

  // Efecto para controlar la visualización del Lottie QR
  useEffect(() => {
    if (backgroundLoaded) {
      // Retrasar ligeramente la aparición del Lottie para asegurar que el fondo esté visible
      const timer = setTimeout(() => {
        setShowQRLottie(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [backgroundLoaded])

  useEffect(() => {
    // Simular la carga del fondo
    const imageLoader = new Image()
    imageLoader.src = "https://cdn.usegalileo.ai/sdxl10/36e7e026-ee59-417b-aa5a-9480957baf30.png"
    imageLoader.onload = () => {
      console.log('🖼️ FONDO CARGADO')
      setBackgroundLoaded(true)
    }
    
    // Backup en caso de que la imagen falle
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
      validateCode(code)
    }
  }, [])

  // Actualizar el estado de carga cuando cambien los estados
  useEffect(() => {
    if (showTransition) {
      setLoadingState('transition')
    } else if (showAliasModal) {
      setLoadingState('modal')
    } else if (isValidating) {
      setLoadingState('validating')
    } else {
      setLoadingState('initial')
    }
  }, [isValidating, showTransition, showAliasModal])

  const validateCode = async (code: string) => {
    console.log('[StartScreen] Validando código:', code)
    setIsValidating(true)
    setShowQRLottie(false)
    
    try {
      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(code)) {
        console.log('[StartScreen] Formato UUID inválido')
        setNextRoute('invalid')
        setShowTransition(true)
        return
      }

      console.log('[StartScreen] Formato UUID válido, consultando a Supabase:', code)
      
      // Consultar a Supabase
      const { data, error } = await supabase
        .from('table_codes')
        .select('id, table_number')
        .eq('id', code)
        .single()

      console.log('[StartScreen] Resultado de Supabase:', { data, error })
      
      if (error) {
        console.error('[StartScreen] Error de Supabase:', error)
        setNextRoute('invalid')
        setShowTransition(true)
        return
      }

      if (!data) {
        console.log('[StartScreen] No se encontró la mesa')
        setNextRoute('invalid')
        setShowTransition(true)
        return
      }

      console.log('[StartScreen] Código válido, datos obtenidos:', data)
      
      // Guardar datos en localStorage
      localStorage.setItem('gourmeton_table_code', code)
      localStorage.setItem('gourmeton_table_number', data.table_number.toString())
      
      // Limpiar la URL
      window.history.replaceState({}, '', '/')
      
      console.log('[StartScreen] Código válido, mostrando transición')
      setNextRoute('valid')
      setShowTransition(true)
      
    } catch (error) {
      console.error('[StartScreen] Error al validar código:', error)
      setNextRoute('invalid')
      setShowTransition(true)
    } finally {
      setIsValidating(false)
    }
  }

  const handleTransitionComplete = () => {
    console.log('📱 TRANSICIÓN COMPLETADA: Próxima ruta =', nextRoute)
    
    if (nextRoute === 'valid') {
      console.log('⭐ MOSTRANDO MODAL: Código válido')
      setShowTransition(false)
      // Esperar un momento antes de mostrar el modal para que la transición se complete
      setTimeout(() => {
        console.log('⭐ ABRIENDO MODAL DESPUÉS DEL TIMEOUT')
        setShowAliasModal(true)
      }, 100)
    } else {
      router.replace('/invalid')
    }
  }

  const handleAliasConfirm = (alias: string) => {
    console.log('✅ ALIAS CONFIRMADO:', alias)
    router.replace('/menu')
  }

  console.log('ESTADO ACTUAL:', { 
    isValidating, 
    showTransition, 
    showAliasModal, 
    nextRoute, 
    loadingState, 
    backgroundLoaded, 
    showQRLottie 
  })

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