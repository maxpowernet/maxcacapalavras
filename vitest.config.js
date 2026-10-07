import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Padrao node (testes de logica pura, mais rapidos). Os testes de
    // componente pedem jsdom pelo docblock `@vitest-environment jsdom`.
    environment: 'node',
    setupFiles: ['./src/setupTests.js'],
  },
});
