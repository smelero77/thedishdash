const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // apunta al directorio raíz de tu proyecto
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};

module.exports = createJestConfig(customJestConfig); 