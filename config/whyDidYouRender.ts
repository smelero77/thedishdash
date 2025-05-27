// whyDidYouRender.ts

interface WhyDidYouRenderNotifierOptions {
  Component?: React.ComponentType<any>;
  displayName?: string;
  name?: string;
  reason: string;
  prevProps: Record<string, any>;
  nextProps: Record<string, any>;
}

// Desactivado temporalmente para resolver problemas de hooks
// if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
//   const React = require('react');
//   const whyDidYouRender = require('@welldone-software/why-did-you-render');

//   console.log('=== WHY DID YOU RENDER CONFIG LOADING ===');
//   console.log('Environment:', process.env.NODE_ENV);

//   whyDidYouRender(React, {
//     trackAllPureComponents: false,
//     trackHooks: true,
//     logOnDifferentValues: false,
//     include: [
//       /^MenuScreen$/,
//       /^CartModal$/,
//       /^MenuItem$/,
//       /^StartScreen$/,
//       /^Providers$/,
//       /^CartProvider$/,
//       /^TableProvider$/,
//       /^CustomerProvider$/,
//       /^VirtualizedMenuItems$/,
//       /^CategorySection$/,
//       /^SearchOverlay$/,
//       /^ModifierModal$/,
//       /^CartItemsContext$/,
//       /^CartTotalContext$/,
//       /^CartActionsContext$/,
//     ],
//     exclude: [
//       /useState/,
//       /useReducer/,
//       /whyDidYouRender/,
//       /FastRefresh/,
//       /config\/whyDidYouRender/,
//     ],
//     collapseGroups: false,
//     notifier: (options: WhyDidYouRenderNotifierOptions) => {
//       const componentName = options.Component
//         ? (options.Component as any).displayName ||
//           (options.Component as any).name ||
//           'Unknown Component'
//         : 'Unknown Component';
//       console.log('=== RENDER INNECESARIO ===');
//       console.log('Component:', componentName);
//       console.log('Reason:', options.reason);
//       console.log('Prev Props:', options.prevProps);
//       console.log('Next Props:', options.nextProps);
//       console.log('=========================');
//     },
//   });

//   console.log('=== WHY DID YOU RENDER CONFIG LOADED ===');
// }

// Exportar una función vacía para que TypeScript lo reconozca como módulo
export const initWhyDidYouRender = () => {};
