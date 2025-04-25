const fs = require('fs');
const path = require('path');

// Carpetas y archivos de screens a mover
const moves = [
  ['components/StartScreen.tsx', 'components/screens/StartScreen.tsx'],
  ['components/AliasScreen.tsx', 'components/screens/AliasScreen.tsx'],
  ['components/InvalidScreen.tsx', 'components/screens/InvalidScreen.tsx'],
  ['components/MenuScreen.tsx', 'components/screens/MenuScreen.tsx'],
  ['components/MenuScreen', 'components/screens/MenuScreen'], // carpeta completa
  ['components/TransitionScreen.tsx', 'components/screens/TransitionScreen.tsx'],
  ['components/CartModal.tsx', 'components/screens/CartModal.tsx'],
  ['components/CategorySection.tsx', 'components/screens/CategorySection.tsx'],
  ['components/MenuPageContent.tsx', 'components/screens/MenuPageContent.tsx'],
  ['components/MenuItem.tsx', 'components/screens/MenuItem.tsx'],
  ['components/SearchOverlay.tsx', 'components/screens/SearchOverlay.tsx'],
  ['components/SearchButton.tsx', 'components/screens/SearchButton.tsx'],
  ['components/ModifierModal.tsx', 'components/screens/ModifierModal.tsx'],
  ['components/TableInfo.tsx', 'components/screens/TableInfo.tsx'],
];

moves.forEach(([src, dest]) => {
  const from = path.resolve(__dirname, '..', src);
  const to = path.resolve(__dirname, '..', dest);
  // Crear carpeta destino si no existe
  const dir = path.dirname(to);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(from)) {
    fs.renameSync(from, to);
    console.log(`Movido: ${src} → ${dest}`);
  } else {
    console.warn(`No encontrado: ${src}`);
  }
});

console.log('Movimiento de screens completado.'); 