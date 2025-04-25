import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // La URL donde corre tu app en dev
    baseUrl: 'http://localhost:3000',
    // Dónde están los specs
    specPattern: 'cypress/e2e/**/*.{js,ts,jsx,tsx}',
    // Fichero de soporte (añade comandos/customs aquí)
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      // aquí puedes añadir listeners de events si los necesitas
      return config;
    },
  },
}); 