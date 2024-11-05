import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'
import fs from 'fs'

function copyAssets() {
  return {
    name: 'copy-assets',
    writeBundle() {
      // Ensure directories exist
      ['dist/lib', 'dist/icons'].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
      })

      // Copy manifest
      fs.copyFileSync('manifest.json', 'dist/manifest.json')

      // Copy styles
      fs.copyFileSync('public/styles.css', 'dist/styles.css')

      // Copy icons
      const iconDir = 'public/icons'
      if (fs.existsSync(iconDir)) {
        fs.readdirSync(iconDir).forEach(file => {
          fs.copyFileSync(
            resolve(iconDir, file),
            resolve('dist/icons', file)
          )
        })
      }

      // Copy library files
      fs.copyFileSync('src/lib/actions.mjs', 'dist/lib/actions.mjs')
    }
  }
}

// Determine which file to build based on command line argument
const buildTarget = process.env.BUILD_TARGET || 'content'

const configs = {
  content: {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/content.jsx'),
        name: 'ChromeAIContent',
        formats: ['iife'],
        fileName: () => 'content.js'
      }
    },
    plugins: [preact(), copyAssets()]
  },
  background: {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/background.js'),
        name: 'ChromeAIBackground',
        formats: ['iife'],
        fileName: () => 'background.js'
      }
    }
  },
  chromeai: {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/chromeai.mjs'),
        name: 'ChromeAI',
        formats: ['iife'],
        fileName: () => 'chromeai.js'
      }
    }
  }
}

// Common config options
const commonConfig = {
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false
      }
    }
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  }
}

// Merge common config with specific config
const targetConfig = configs[buildTarget]
const mergedConfig = {
  ...commonConfig,
  ...targetConfig,
  build: {
    ...commonConfig.build,
    ...targetConfig.build
  }
}

export default defineConfig(mergedConfig)
