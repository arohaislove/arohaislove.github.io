import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This base path ensures the app works on GitHub Pages
  // GitHub Pages serves from: https://arohaislove.github.io/chromesthesia-audio/
  base: '/chromesthesia-audio/',
  build: {
    // Output to the root of the chromesthesia-audio folder (not dist/)
    // This makes GitHub Pages deployment simpler
    outDir: '.',
    // Don't empty the output directory (preserve source files)
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // Put all assets in an assets folder for cleaner organization
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  }
})
