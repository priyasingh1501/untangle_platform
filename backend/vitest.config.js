import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./server/__tests__/setup.js'],
    include: ['server/**/*.test.js'],
    exclude: [
      '**/node_modules/**',
      '**/e2e-tests/**',
      '**/client/**'
    ],
    // Run tests in sequence to avoid race conditions with mongoose models
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'scripts/',
        'e2e-tests/',
        'client/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/__tests__/**',
        '**/coverage/**'
      ]
    }
  }
});
