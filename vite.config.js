import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'
import fs from 'fs'

// Copy files to dist during build
function copyFiles() {
  return {
    name: 'copy-files',
    writeBundle() {
      // Copy manifest and styles to dist folder
      fs.copyFileSync('manifest.json', 'dist/manifest.json')
      fs.copyFileSync('styles.css', 'dist/styles.css')
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
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      }
    }
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h } from 'preact'`
  }
})