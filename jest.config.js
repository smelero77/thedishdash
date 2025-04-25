const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // apunta al directorio raíz de tu proyecto
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx)$',
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/cypress/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
    '^@/components/screens/(.*)$': '<rootDir>/components/screens/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/context/(.*)$': '<rootDir>/context/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};

module.exports = createJestConfig(customJestConfig); 