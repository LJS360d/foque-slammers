import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/foque-slammers/', // for github pages deploy
  plugins: [
    basicSsl()
  ],
  optimizeDeps: {
    exclude: ["excalibur"],
  },
  build: {
    assetsInlineLimit: 0,
    sourcemap: true,
    // Vite uses rollup currently for prod builds so a separate config is needed
    // to keep vite from bundling ESM together with commonjs
    rollupOptions: {
      output: {
        format: 'umd'
      }
    }
  },
});