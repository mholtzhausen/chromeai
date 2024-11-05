import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'
import fs from 'fs'

function copyFiles() {
  return {
    name: 'copy-files',
    writeBundle() {
      // Create directories if they don't exist
      if (!fs.existsSync('dist/lib')) {
        fs.mkdirSync('dist/lib', { recursive: true })
      }

      // Copy files
      fs.copyFileSync('manifest.json', 'dist/manifest.json')
      fs.copyFileSync('public/styles.css', 'dist/styles.css')
      fs.copyFileSync('src/lib/actions.mjs', 'dist/lib/actions.mjs')
    }
  }
}

export default defineConfig({
  plugins: [preact(), copyFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.jsx'),
        background: resolve(__dirname, 'src/background.js')
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
