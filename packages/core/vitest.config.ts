import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 5000,
    pool: 'forks',
    env: {
      NODE_ENV: 'test',
    },
  },
});
