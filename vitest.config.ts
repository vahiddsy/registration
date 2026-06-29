import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/lib/**/*.ts', 'src/repositories/**/*.ts', 'src/services/**/*.ts', 'src/utils/**/*.ts', 'src/validation/**/*.ts'],
      exclude: ['src/lib/prisma.ts', 'src/lib/auth.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
