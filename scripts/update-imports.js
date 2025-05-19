const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mapeo de rutas antiguas a nuevas
const mappings = {
  '@/components/button': '@/components/ui/Button',
  '@/components/input': '@/components/ui/Input',
  '@/components/dialog': '@/components/ui/Dialog',
  '@/components/alias-modal': '@/components/ui/AliasModal',
  '@/components/code-validation-error': '@/components/ui/CodeValidationError',
  '@/components/code-validation-loader': '@/components/ui/CodeValidationLoader',
  '@/components/loading-fallback': '@/components/ui/LoadingFallback',
  '@/components/table-info': '@/components/ui/TableInfo',
  '@/components/toast': '@/components/ui/Toast',
  '@/components/toaster': '@/components/ui/Toaster',
  '@/components/TableIcon': '@/components/ui/TableIcon',
  '@/components/StartScreen': '@/components/screens/StartScreen',
  '@/components/AliasScreen': '@/components/screens/AliasScreen',
  '@/components/InvalidScreen': '@/components/screens/InvalidScreen',
  '@/components/MenuScreen$': '@/components/screens/MenuScreen',
  '@/components/MenuScreen/': '@/components/screens/MenuScreen/',
  '@/components/TransitionScreen': '@/components/screens/TransitionScreen',
  '@/components/CartModal': '@/components/screens/CartModal',
  '@/components/CategorySection': '@/components/screens/CategorySection',
  '@/components/MenuPageContent': '@/components/screens/MenuPageContent',
  '@/components/MenuItem': '@/components/screens/MenuItem',
  '@/components/SearchButton': '@/components/screens/SearchButton',
  '@/components/ModifierModal': '@/components/screens/ModifierModal',
  '@/components/TableInfo': '@/components/screens/TableInfo',
};

// Archivos a procesar
const targetFiles = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'scripts/**'],
});

console.log(`Procesando ${targetFiles.length} archivos...`);

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf-8');
  let updated = content;

  Object.entries(mappings).forEach(([oldPath, newPath]) => {
    const regex = new RegExp(`(['"])${oldPath}(['"])`, 'g');
    updated = updated.replace(regex, `$1${newPath}$2`);
  });

  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf-8');
    console.log(`Actualizado imports en: ${file}`);
  }
});

console.log('Actualización de imports completada.');
