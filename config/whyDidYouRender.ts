import React from 'react'
import whyDidYouRender from '@welldone-software/why-did-you-render'

// Añadir logs más visibles
console.log('=== WHY DID YOU RENDER CONFIG LOADING ===')
console.log('Environment:', process.env.NODE_ENV)

// Forzar el modo desarrollo
whyDidYouRender(React, {
  trackAllPureComponents: true,
  include: [/^.*/],
  collapseGroups: false, // Desactivar colapso para ver todos los logs
  logOnDifferentValues: true,
  notifier: (options) => {
    console.log('=== WHY DID YOU RENDER ===')
    console.log('Props:', options.prevProps)
    console.log('Next Props:', options.nextProps)
    console.log('Reason:', options.reason)
    console.log('=======================')
  }
}

)

console.log('=== WHY DID YOU RENDER CONFIG LOADED ===')
