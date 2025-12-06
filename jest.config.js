// Jest configuration for testing

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 5, // Realistic for initial implementation - will increase as more tests are added
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@gui/(.*)$': '<rootDir>/src/gui/$1',
    '^@bot/(.*)$': '<rootDir>/src/bot/$1',
  },
};

