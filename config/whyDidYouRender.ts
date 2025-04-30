// whyDidYouRender.ts - Intento B
import React from 'react'
import whyDidYouRender from '@welldone-software/why-did-you-render'

console.log('=== WHY DID YOU RENDER CONFIG LOADING ===')
console.log('Environment:', process.env.NODE_ENV)

whyDidYouRender(React, {
    trackAllPureComponents: false,
    trackHooks: true,
    logOnDifferentValues: false,
    include: [
        /^MenuScreen$/,
        /^CartModal$/,
        /^MenuItem$/,
        /^StartScreen$/,
        /^Providers$/,
        /^CartProvider$/,
        /^TableProvider$/,
        /^CustomerProvider$/,
        /^VirtualizedMenuItems$/,
        /^CategorySection$/,
        /^SearchOverlay$/,
        /^ModifierModal$/,
        /^CartItemsContext$/,
        /^CartTotalContext$/,
        /^CartActionsContext$/,
    ],
    exclude: [
        /useState/,
        /useReducer/,
        /whyDidYouRender/,
        /FastRefresh/,
        /config\/whyDidYouRender/,
    ],
    collapseGroups: false,
    notifier: options => {
        const componentName = options.Component ? 
            (options.Component as any).displayName || 
            (options.Component as any).name || 
            'Unknown Component' : 
            'Unknown Component';
        console.log('=== RENDER INNECESARIO ===');
        console.log('Component:', componentName);
        console.log('Reason:', options.reason);
        console.log('Prev Props:', options.prevProps);
        console.log('Next Props:', options.nextProps);
        console.log('=========================');
    },
})

console.log('=== WHY DID YOU RENDER CONFIG LOADED ===')