import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /* for example, use global to avoid globals imports (describe, test, expect): */
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setupTests'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**', '!src/main/index.ts', '!src/test/**'],
      reporter: ['html', 'text', 'json-summary', 'json'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 70,
        statements: 80,
      },
    },
  },
});
