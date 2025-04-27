"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useCustomer } from '@/context/CustomerContext'
import { useTable } from '@/context/TableContext'

interface AliasModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (alias: string) => Promise<boolean>
}

function generateRandomAlias(tableNumber: string): string {
  const names = ['Foodie', 'Cinéfilo', 'Fan del vermut', 'Comensal', 'Sibarita']
  const randomName = names[Math.floor(Math.random() * names.length)]
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${randomName}_${suffix}`
}

export function AliasModal({ isOpen, onClose, onConfirm }: AliasModalProps) {
  const [alias, setAlias] = useState('')
  const { alias: storedAlias, isLoading } = useCustomer()
  const { tableNumber } = useTable()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const finalAlias = alias.trim() || generateRandomAlias(tableNumber?.toString() || '0')
    try {
      const success = await onConfirm(finalAlias)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error al confirmar alias:', error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 min-h-screen w-full"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20,
              mass: 1
            }}
            className="relative flex size-full min-h-screen flex-col bg-black group/design-root overflow-hidden"
            style={{ fontFamily: 'Epilogue, "Noto Sans", sans-serif' }}
          >
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
            
            {/* Header con título principal */}
            <div className="flex flex-col items-center pt-16 pb-8 relative z-10">
              <motion.h1 
                className="text-[#1ce3cf] text-5xl font-black leading-none tracking-tight text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                EL GOURMETON
              </motion.h1>
            </div>
            
            {/* Contenido principal */}
            <div className="flex w-full grow px-4 py-6 flex-col items-center justify-center relative z-10">
              <motion.div
                className="max-w-md w-full p-8 bg-white/25 backdrop-blur-md rounded-3xl border border-white/30 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="flex flex-col items-center space-y-5">
                  {/* Lottie animación con mejores proporciones */}
                  <motion.div 
                    className="w-40 h-36"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: 0.6
                    }}
                  >
                    <DotLottieReact
                      src="https://lottie.host/cadb6b62-74e5-48a0-8d6a-8eab09e332b5/iiIBNG6xAU.lottie"
                      loop
                      autoplay
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </motion.div>
                  
                  <motion.h2 
                    className="text-[#1ce3cf] text-3xl font-bold text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    Hazte un hueco en la mesa
                  </motion.h2>
                  
                  {storedAlias && (
                    <motion.p 
                      className="text-white text-center text-xl font-medium mb-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      ¡Hola <span className="text-[#1ce3cf]">{storedAlias.split(' ')[0]}</span>! 👋
                    </motion.p>
                  )}
                  
                  <motion.p 
                    className="text-white text-center text-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    Añade tu nombre o tu alias para que el staff sepa a quién servir 😋
                  </motion.p>

                  <motion.form 
                    onSubmit={handleSubmit} 
                    className="w-full space-y-5 mt-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        placeholder="Tu nombre o alias (opcional)"
                        className="w-full px-5 py-4 text-white bg-white/10 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1ce3cf] focus:border-transparent placeholder-white/50 text-lg"
                      />
                    </div>

                    <motion.button
                      type="button"
                      onClick={handleSubmit}
                      className="w-full py-4 px-5 bg-[#1ce3cf] text-[#0e1b19] text-lg font-bold rounded-xl flex items-center justify-center space-x-2 active:bg-[#19cfc0]"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Entrar en la mesa</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="ml-1"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </motion.button>
                  </motion.form>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 