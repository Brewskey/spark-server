/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  openHandlesTimeout: 1000,
};
