// thedishdash/components/screens/StartScreen.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from 'react';

import { CodeValidationLoader } from '@/components/ui/CodeValidationLoader';
import { CodeValidationError } from '@/components/ui/CodeValidationError';



import { useRouter, useSearchParams } from 'next/navigation';
// Asegúrate de que TransitionScreen maneja bien sus renders internos o está memoizado
import TransitionScreen from './TransitionScreen';
// Importación nombrada (verifica que AliasModal.tsx exporta 'AliasModal')
import { AliasModal, AliasModalProps } from '@/components/ui/AliasModal'; // Importamos el tipo de props si existe

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTableCodeValidation } from '@/hooks/useTableCodeValidation';
import { useCustomer } from '@/context/CustomerContext';
// Asumiendo que useTable se exporta nombrado
import { useTable } from '@/context/TableContext';
// !!! IMPORTANTE: Verifica cómo se exporta realmente useCart
// Si es 'export function useCart()', usa:
import { initializeCart } from '@/hooks/useCart';

import { cn } from '@/utils/cn';


// Componente personalizado para Lottie con log y memoización
interface LoggedLottieProps {
  name: string
  src: string
  loop?: boolean
  autoplay?: boolean
  [key: string]: any;
}

const LoggedLottie = ({ name, src, ...props }: LoggedLottieProps) => {
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      console.log(`🔄 CARGANDO LOTTIE: ${name}`);
      isInitialRender.current = false;
      return () => console.log(`🛑 DESCARGANDO LOTTIE: ${name}`);
    }
  }, [name]);

  return <DotLottieReact src={src} {...props} />;
};

// Memoizar LoggedLottie si sus props son estables
const MemoizedLoggedLottie = React.memo(LoggedLottie);


// --- useReducer State Management ---

// Definimos los estados posibles de la pantalla
type ScreenState =
  | 'idle' // Estado inicial, esperando lógica de carga
  | 'initial-qr' // No hay código, mostrando el QR para escanear
  | 'validating' // Validando código de URL o LocalStorage
  | 'transition-success' // Mostrando transición después de validación exitosa
  | 'transition-error' // Mostrando transición después de error de validación
  | 'alias-modal' // Mostrando modal de alias
  | 'saving-alias' // Guardando el alias
  | 'error' // Mostrando pantalla de error específica (después de transition-error)
  | 'success-navigate'; // Lógica completa, listo para navegar al menú

// Definimos las acciones que pueden ocurrir
type ReducerAction =
  | { type: 'START_VALIDATION'; payload?: { code?: string | null; storedCode?: string | null } }
  | { type: 'VALIDATION_SUCCESS'; payload: { tableNumber: number; tableId: string } }
  | { type: 'VALIDATION_ERROR'; payload: { message: string | null } }
  | { type: 'BACKGROUND_LOADED' } // Acción cuando la imagen de fondo ha cargado
  | { type: 'NO_CODE_FOUND' } // Acción si no se encuentra código en URL ni LocalStorage
  | { type: 'TRANSITION_COMPLETE'; payload: { fromState: ScreenState } } // Indica de qué estado se completó la transición
  | { type: 'START_SAVE_ALIAS' }
  | { type: 'SAVE_ALIAS_SUCCESS' }
  | { type: 'SAVE_ALIAS_ERROR'; payload: { message?: string } }
  | { type: 'CANCEL_ALIAS_MODAL' }
  | { type: 'INITIALIZE_CART_ERROR'; payload: { message: string } }
  | { type: 'NAVIGATION_COMPLETE' } // Opcional: para manejar el estado después de navegar
  | { type: 'RETRY' }; // Acción para reintentar

// Definimos la forma del estado del reducer
interface ReducerState {
  screenState: ScreenState;
  validationError: string | null;
  // backgroundLoaded se mantiene como un useState separado ya que es un evento externo
  // isSavingAlias se mantiene como estado del hook useCustomer
}

const initialState: ReducerState = {
  screenState: 'idle',
  validationError: null,
};

// La función reducer que maneja todas las transiciones de estado
function screenReducer(state: ReducerState, action: ReducerAction): ReducerState {
  console.log('[StartScreen Reducer] Acción:', action.type, 'Estado actual:', state.screenState);
  switch (action.type) {
    case 'START_VALIDATION':
      return { ...state, screenState: 'validating', validationError: null };

    case 'VALIDATION_SUCCESS':
      return { ...state, screenState: 'transition-success', validationError: null };

    case 'VALIDATION_ERROR':
      // Transición a transition-error
      return { ...state, screenState: 'transition-error', validationError: action.payload.message };

    case 'NO_CODE_FOUND':
      return { ...state, screenState: 'initial-qr', validationError: null };

    case 'BACKGROUND_LOADED':
      // Si estábamos en 'idle' y el fondo carga, pasamos a 'initial-qr'
      if (state.screenState === 'idle') {
        return { ...state, screenState: 'initial-qr' };
      }
      // Si ya estábamos en otro estado, no hay cambio de estado principal aquí
      return state;

    case 'TRANSITION_COMPLETE':
      if (action.payload.fromState === 'transition-success') {
        // Después de la transición de éxito, vamos al modal de alias
        return { ...state, screenState: 'alias-modal' };
      } else if (action.payload.fromState === 'transition-error') {
        // Después de la transición de error, vamos a la pantalla de error final
        return { ...state, screenState: 'error' };
      }
      return state; // No hacemos nada si la transición no viene de un estado esperado


    case 'START_SAVE_ALIAS':
      return { ...state, screenState: 'saving-alias' };

    case 'SAVE_ALIAS_SUCCESS':
      return { ...state, screenState: 'success-navigate', validationError: null };

    case 'SAVE_ALIAS_ERROR':
      // Volvemos al modal, posiblemente con un mensaje de error
      console.error('[StartScreen Reducer] Error al guardar alias:', action.payload.message);
      return { ...state, screenState: 'alias-modal', validationError: action.payload.message || 'Error al guardar alias' };


    case 'CANCEL_ALIAS_MODAL':
      return { ...state, screenState: 'initial-qr', validationError: null };

    case 'INITIALIZE_CART_ERROR':
      console.error('[StartScreen Reducer] Error al inicializar carrito:', action.payload.message);
      return { ...state, screenState: 'error', validationError: action.payload.message };

    case 'RETRY':
      return { ...initialState, screenState: 'initial-qr' };

    case 'NAVIGATION_COMPLETE':
      return { ...initialState, screenState: 'idle' };


    default:
      console.warn('[StartScreen Reducer] Acción desconocida:', action);
      return state;
  }
}


// --- StartScreen Component ---

function StartScreen() {

  const router = useRouter();
  const searchParams = useSearchParams();

  // Destructuramos validateCode del hook
  const { validateCode, error: tableCodeValidationErrorHook } = useTableCodeValidation();

  // Usamos useReducer para gestionar el estado principal y los errores
  const [state, dispatch] = useReducer(screenReducer, initialState);
  const { screenState, validationError } = state;

  const { setTableNumber } = useTable();
  const { saveAlias, isLoading: isSavingAliasHook } = useCustomer();

  // Estado para controlar si la imagen de fondo ha cargado (evento externo)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);


  // --- Efectos para manejar el Flujo ---

  // Efecto 1: Lógica inicial de carga (leer URL/LocalStorage, iniciar validación o QR)
  useEffect(() => {
    console.log('[StartScreen Effect 1] Lógica inicial, estado:', screenState, 'fondo cargado:', backgroundLoaded);

    // Solo ejecutar si estamos en el estado 'idle' inicial
    if (screenState === 'idle') {
      const code = searchParams.get('code');
      const storedCode = localStorage.getItem('tableCode');

      if (code || storedCode) {
        const codeToValidate = code || storedCode!;
        console.log('[StartScreen Effect 1] Código encontrado, dispatch START_VALIDATION.');
        dispatch({ type: 'START_VALIDATION' });

        // Usar una función async separada dentro del efecto
        const performValidation = async () => {
          const { table, error: hookError } = await validateCode(codeToValidate);

          if (hookError || !table) {
            console.error('[StartScreen Effect 1] Error de validación hook:', hookError);
            dispatch({ type: 'VALIDATION_ERROR', payload: { message: hookError || 'Código inválido' } });
          } else {
            console.log('[StartScreen Effect 1] Validación exitosa, dispatch VALIDATION_SUCCESS.');
            // Guardar datos de mesa (fuera del reducer)
            setTableNumber(table.table_number);
            localStorage.setItem('tableNumber', table.table_number.toString());
            localStorage.setItem('tableCode', table.id);
            dispatch({ type: 'VALIDATION_SUCCESS', payload: { tableNumber: table.table_number, tableId: table.id } });
          }
        };
        performValidation(); // Ejecutar la función async

      } else {
        // No hay código, pasar a estado de espera de QR (posiblemente después de cargar fondo)
        console.log('[StartScreen Effect 1] No hay código encontrado.');
        // La transición a 'initial-qr' la maneja el efecto de carga de fondo si backgroundLoaded es falso/true
        if (backgroundLoaded) {
          // Si el fondo ya cargó, vamos directo a initial-qr
          dispatch({ type: 'NO_CODE_FOUND' });
        } else {
          // Si el fondo no cargó, el estado se mantiene en 'idle',
          // y el efecto 2 (carga de fondo) hará el dispatch({ type: 'NO_CODE_FOUND' })
          // cuando termine de cargar.
          console.log('[StartScreen Effect 1] Esperando fondo antes de dispatch NO_CODE_FOUND.');
        }
      }
    }

    // Dependencias: dispatch, searchParams (leído aquí), validateCode (usado aquí),
    // setTableNumber (usado aquí), backgroundLoaded (para decidir la transición si no hay código),
    // screenState (para la guardia 'idle').
  }, [dispatch, searchParams, validateCode, setTableNumber, backgroundLoaded, screenState]);


  // Efecto 2: Cargar la imagen de fondo y transicionar a 'initial-qr' si no hay código (solo si está en idle)
  useEffect(() => {
    console.log('[StartScreen Effect 2] Carga de fondo, estado:', screenState, 'fondo cargado:', backgroundLoaded);

    // Si el fondo ya cargó O no estamos en el estado 'idle' esperando el fondo, salimos.
    // No chequeamos 'initial-qr' aquí, porque la transición a 'initial-qr' es el *resultado*
    // de este efecto si estábamos en 'idle' y el fondo cargó.
    if (backgroundLoaded || screenState !== 'idle') {
      console.log('[StartScreen Effect 2] Fondo ya cargado o no es necesario (no en idle).');
      return;
    }

    console.log('[StartScreen Effect 2] Iniciando carga de fondo...');
    let timer: NodeJS.Timeout;
    const imageLoader = new Image();
    imageLoader.src = "https://cdn.usegalileo.ai/sdxl10/36e7ee59-417b-aa5a-9480957baf30.png"; // Usar URL correcta

    const handleLoad = () => {
      console.log('🖼️ FONDO CARGADO (Handler)');
      setBackgroundLoaded(true);
      // Si estábamos en 'idle' cuando cargó el fondo, y no encontramos código en Efecto 1,
      // ahora podemos pasar a mostrar el QR.
      if (screenState === 'idle') {
        console.log('[StartScreen Effect 2] Fondo cargado en estado idle, dispatch NO_CODE_FOUND.');
        dispatch({ type: 'NO_CODE_FOUND' });
      }
    };

    imageLoader.onload = handleLoad;
    imageLoader.onerror = (err) => {
      console.error('🖼️ ERROR CARGANDO FONDO:', err);
      // Aunque falle, marcamos como cargado (o manejamos un estado de fondo fallido)
      setBackgroundLoaded(true); 
      if (screenState === 'idle') {
        dispatch({ type: 'NO_CODE_FOUND' }); // Procedemos como si no hubiera código, pero sin fondo
      }
    };


    // Timeout de respaldo
    timer = setTimeout(() => {
      if (!backgroundLoaded) {
        console.log('🖼️ FONDO CARGADO (TIMEOUT)');
        setBackgroundLoaded(true);
        if (screenState === 'idle') {
          dispatch({ type: 'NO_CODE_FOUND' });
        }
      }
    }, 3000); // Aumentado timeout por si acaso

    return () => {
      console.log('[StartScreen Effect 2] Cleanup');
      clearTimeout(timer);
      imageLoader.onload = null;
      imageLoader.onerror = null;
    };

    // Dependencias: dispatch (estable), backgroundLoaded (estado que cambia),
    // screenState (para la guardia 'idle' y la lógica de dispatch)
  }, [dispatch, backgroundLoaded, screenState]);


  // Efecto 3: Manejar la inicialización del carrito y navegación después de guardar alias
  useEffect(() => {
    console.log('[StartScreen Effect 3] Manejando estado:', screenState);

    if (screenState === 'success-navigate') {
      console.log('[StartScreen Effect 3] Estado success-navigate, inicializando carrito...');

      // Usamos una función async inmediatamente invocada (IIFE)
      (async () => {
        const currentTableNumberStr = localStorage.getItem('tableNumber');

        if (currentTableNumberStr) {
          const currentTableNumber = parseInt(currentTableNumberStr, 10);

          // Validar que el número de mesa es un número válido
          if (!isNaN(currentTableNumber)) {
            try {
              console.log('[StartScreen Effect 3] Llamando initializeCart con:', currentTableNumber);
              await initializeCart(currentTableNumber);
              console.log('[StartScreen Effect 3] Carrito inicializado. Navegando...');

              // Navegar después de inicializar carrito
              const code = localStorage.getItem('tableCode');
              if (code) {
                router.replace(`/menu?code=${code}`); // Usar replace para no volver a StartScreen
              } else {
                router.replace('/menu');
              }
              // Opcional: dispatch({ type: 'NAVIGATION_COMPLETE' }); si necesitas un estado final aquí

            } catch (cartError: any) { // Captura de error más específica
              console.error('[StartScreen Effect 3] Error al inicializar carrito:', cartError);
              dispatch({ type: 'INITIALIZE_CART_ERROR', payload: { message: cartError?.message || 'Error desconocido al inicializar carrito' } });
            }
          } else {
            console.error('[StartScreen Effect 3] Número de mesa de localStorage no es un número válido:', currentTableNumberStr);
            dispatch({ type: 'INITIALIZE_CART_ERROR', payload: { message: 'Error al obtener número de mesa válido' } });
          }
        } else {
          console.error('[StartScreen Effect 3] No se encontró número de mesa en localStorage.');
          dispatch({ type: 'INITIALIZE_CART_ERROR', payload: { message: 'Número de mesa no encontrado' } });
        }
      })(); // Invocar la función async inmediatamente
    }

    // Dependencias: screenState (para activarse), initializeCart (estable), router (estable), dispatch (estable)
    // No necesitamos localStorage aquí como dependencia, lo leemos dentro del efecto cuando el estado es 'success-navigate'.
  }, [screenState, initializeCart, router, dispatch]);


  // --- Handlers de Eventos ---

  // Handler que se llama cuando termina la transición de pantalla
  const handleTransitionComplete = useCallback(() => {
    console.log('[StartScreen Handler] Transición completada. Estado actual:', screenState);

    // Pasamos el estado actual para que el reducer sepa de dónde venimos
    dispatch({ type: 'TRANSITION_COMPLETE', payload: { fromState: screenState } });

  }, [screenState, dispatch]); // Depende de screenState y dispatch

  // Función para manejar la confirmación del alias en el modal
  const handleAliasConfirm = useCallback(async (alias: string): Promise<boolean> => {
    console.log('[StartScreen Handler] Alias confirmado:', { alias });
    dispatch({ type: 'START_SAVE_ALIAS' });

    const success = await saveAlias(alias);
    console.log('[StartScreen Handler] Resultado guardado:', { success });

    if (success) {
      dispatch({ type: 'SAVE_ALIAS_SUCCESS' });
      return true;
    } else {
      console.error('[StartScreen Handler] Error al guardar alias (saveAlias falló)');
      // Puedes obtener un mensaje de error más detallado de saveAlias si lo proporciona
      dispatch({ type: 'SAVE_ALIAS_ERROR', payload: { message: 'No se pudo guardar el alias.' } });
      return false;
    }
  }, [saveAlias, dispatch]); // Depende de saveAlias y dispatch

  // Función para cerrar el modal de alias (ej. si se cancela)
  const handleAliasModalClose = useCallback(() => {
    console.log('[StartScreen Handler] Modal de alias cerrado (Cancelado).');
    dispatch({ type: 'CANCEL_ALIAS_MODAL' });
  }, [dispatch]); // Depende solo de dispatch


  // Handler para reintentar (ej. desde la pantalla de error)
  const handleRetry = useCallback(() => {
    console.log('[StartScreen Handler] Reintentando...');
    dispatch({ type: 'RETRY' }); // Resetea al estado inicial para empezar de nuevo
  }, [dispatch]); // Depende solo de dispatch


  // --- Renderizado Condicional basado ÚNICAMENTE en screenState ---

  // Usamos useMemo para renderizar el contenido principal basado en screenState
  const mainContent = useMemo(() => {
    console.log('[StartScreen useMemo] Recalculando mainContent. Estado:', screenState);

    switch (screenState) {
      case 'idle':
        // No renderizamos nada en 'idle' con initial={false} en AnimatePresence
        return null;

      case 'initial-qr':
        // Mostrar el Lottie QR solo si el fondo ha cargado
        return (
          backgroundLoaded ? (
            // Contenido del estado initial-qr
            <motion.div // motion.div aquí para que AnimatePresence pueda animar su entrada/salida
              key="initial-qr-content" // Key para AnimatePresence
              className="flex flex-col items-center justify-center grow relative z-10 w-full"
            >
              <div className="w-32 h-32 mb-8">
                <MemoizedLoggedLottie
                  name="LOTTIE_QR_INITIAL"
                  src="https://lottie.host/64d2a522-5b74-4170-867f-5325128d3d8e/6M1Hh4xBSr.lottie"
                  loop
                  autoplay
                />
              </div>
              <p className="text-white text-center text-xl px-4">Escanea el código QR de tu mesa para comenzar.</p>
            </motion.div>
          ) : (
            // Mostrar un cargador simple si estamos en initial-qr pero el fondo no ha cargado
            <motion.div key="loading-bg" className="flex items-center justify-center grow relative z-10 text-white w-full">
              <p>Cargando fondo...</p>
            </motion.div>
          )
        );


      case 'validating':
        return <CodeValidationLoader key="validating-loader" message="Validando código de mesa..." />;

      case 'transition-success':
        return <TransitionScreen key="transition-success" onComplete={handleTransitionComplete} />;

      case 'transition-error':
        // Mostramos la transición de error
        return <TransitionScreen key="transition-error" onComplete={handleTransitionComplete} /* puedes pasar un prop de error si TransitionScreen lo soporta */ />;


      case 'alias-modal':
        // El modal se renderiza fuera del switch, controlado por el estado.
        // Este caso aquí es para lo que se muestra en el fondo, si aplica.
        return (
          <motion.div key="alias-modal-bg" className="flex items-center justify-center grow relative z-10 text-white w-full">
            {/* Contenido de fondo mientras el modal está abierto */}
          </motion.div>
        );


      case 'saving-alias':
        return <CodeValidationLoader key="saving-loader" message="Guardando alias..." />;

      case 'error':
        // Pasar el handler de reintento a la pantalla de error
        return <CodeValidationError key="validation-error" message={`Error: ${validationError || 'Ha ocurrido un error desconocido'}`} onRetry={handleRetry} />;

      case 'success-navigate':
        return (
          <motion.div key="success-navigating" className="flex items-center justify-center grow relative z-10 text-white w-full">
            <p>Completado, redirigiendo al menú...</p>
          </motion.div>
        );


      default:
        console.warn('[StartScreen useMemo] Estado de pantalla desconocido:', screenState);
        return (
          <motion.div key="unknown-state-error" className="flex items-center justify-center grow relative z-10 text-red-500 w-full">
            <p>Estado de pantalla inesperado. Por favor, recargue.</p>
          </motion.div>
        );
    }
  }, [screenState, validationError, backgroundLoaded, handleTransitionComplete, handleRetry]);


  // Efecto para loguear cambios de estado principal (debugging)
  useEffect(() => {
      console.log('[StartScreen Effect State Log] ESTADO PRINCIPAL CAMBIADO:', screenState);
   }, [screenState]);


  // --- Renderizado Principal ---

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-black group/design-root overflow-hidden">
      {/* Imagen de fondo con filtro */}
      {/* La animación de opacidad inicial de la capa de fondo */}
      <motion.div
        className="absolute inset-0 z-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: backgroundLoaded ? 1 : 0 }} // Animamos la opacidad al cargar el fondo
        transition={{ duration: 0.5 }}
      >
        <div
          className="w-full h-full bg-center bg-no-repeat bg-cover mix-blend-overlay brightness-75"
          style={{ backgroundImage: 'url("https://cdn.usegalileo.ai/sdxl10/36e7e026-ee59-417b-aa5a-9480957baf30.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
      </motion.div>


      {/* Contenido principal basado en el estado */}
      {/* AnimatePresence permite animaciones al cambiar el contenido del switch */}
      {/* initial={false} evita la animación en el montaje inicial, útil cuando idle renderiza null */}
      <AnimatePresence mode='wait' initial={false}>
        {/* El motion.div interno es el que AnimatePresence anima cuando cambia su key */}
        {mainContent} {/* Renderiza el contenido calculado por useMemo */}
      </AnimatePresence>


      {/* Modal de Alias - Se renderiza siempre pero su visibilidad se controla con 'isOpen' */}
      {/* Controlado por screenState === 'alias-modal' */}
      <AliasModal
        isOpen={screenState === 'alias-modal'}
        onClose={handleAliasModalClose}
        onConfirm={handleAliasConfirm}
        // Pasamos las props isLoading y error al modal
        isLoading={isSavingAliasHook}
        error={screenState === 'alias-modal' ? validationError : null} // Pasamos el error solo si estamos en este estado
      />
    </div>
  );
}
export default React.memo(StartScreen);