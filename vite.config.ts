import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), wasm()],
  publicDir: 'contracts/artifacts',
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
      util: 'util',
      crypto: fileURLToPath(new URL('./src/lib/crypto-shim.ts', import.meta.url)),
      stream: 'stream-browserify',
      events: 'events',
      assert: 'assert',
      'isomorphic-ws': fileURLToPath(new URL('./src/lib/isomorphic-ws-shim.ts', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['level', 'browser-level', 'abstract-level', 'level-supports', 'level-transcoder'],
    esbuildOptions: { target: 'esnext' },
  },
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
  assetsInclude: ['**/*.wasm'],
  test: { environment: 'jsdom' },
})
