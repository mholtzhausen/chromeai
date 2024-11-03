import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'
import fs from 'fs'

function copyFiles() {
  return {
    name: 'copy-files',
    writeBundle() {
      fs.copyFileSync('manifest.json', 'dist/manifest.json')
      fs.copyFileSync('public/styles.css', 'dist/styles.css')  // Update this path
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
