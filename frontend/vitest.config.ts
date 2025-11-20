import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['node_modules', '.next', 'e2e/**', 'playwright/**', '**/*.e2e.*'], // Exclude Playwright tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        '**/*.config.*',
        '**/types/**',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        'e2e/**',
        'playwright/**',
      ],
    },
  },
  resolve: {
    alias: [
      { find: '@/shared', replacement: path.resolve(__dirname, '../shared') }, // Put @/shared FIRST
      { find: '@', replacement: path.resolve(__dirname, './') },
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
});
