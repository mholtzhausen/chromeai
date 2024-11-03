import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: 'src/content.jsx',
        background: 'src/background.js'
      },
      output: {
        entryFileNames: '[name].js'
      },
    },
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