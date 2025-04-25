const fs = require('fs');
const path = require('path');

// Lista de renombrados: [nombre actual, nuevo nombre]
const renames = [
  ['button.tsx', 'Button.tsx'],
  ['input.tsx', 'Input.tsx'],
  ['dialog.tsx', 'Dialog.tsx'],
  ['alias-modal.tsx', 'AliasModal.tsx'],
  ['code-validation-error.tsx', 'CodeValidationError.tsx'],
  ['code-validation-loader.tsx', 'CodeValidationLoader.tsx'],
  ['loading-fallback.tsx', 'LoadingFallback.tsx'],
  ['table-info.tsx', 'TableInfo.tsx'],
  ['toast.tsx', 'Toast.tsx'],
  ['toaster.tsx', 'Toaster.tsx']
];

renames.forEach(([current, newName]) => {
  const from = path.resolve(__dirname, '..', 'components/ui', current);
  const to = path.resolve(__dirname, '..', 'components/ui', newName);
  if (fs.existsSync(from)) {
    fs.renameSync(from, to);
    console.log(`Renombrado: ${current} → ${newName}`);
  } else {
    console.warn(`No encontrado: ${current}`);
  }
});

console.log('Renombrado de componentes UI completado.'); 