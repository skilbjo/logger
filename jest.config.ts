import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  coverageReporters: ['lcov'],
  moduleFileExtensions: ['ts', 'json', 'js'],
  moduleNameMapper: {
    '@dist/(.*)': '<rootDir>/dist/$1',
    '@src/(.*)': '<rootDir>/src/$1',
    '@test/(.*)': '<rootDir>/test/$1',
  },
  preset: 'ts-jest',
  rootDir: './',
  testEnvironment: 'node',
  testMatch: ['**/*.(test|integration).ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
      },
    ],
  },
};

export default config;
