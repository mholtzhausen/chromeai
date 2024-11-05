import { render } from 'preact'
import { ChatInterface } from './components/ChatInterface'
import { actions } from './lib/actions.mjs' // Import actions

const iconUrls = {
  copy: chrome.runtime.getURL('icons/copy.svg'),
}

// Create tab element
const tab = document.createElement('div')
tab.innerHTML = '✨'
tab.style.cssText = `
  position: fixed;
  right: 0;
  top: 50%;
  width: 15px;
  padding: 12px 2px;
  transform: translateY(-50%);
  background: #4285f4;
  color: white;
  cursor: pointer;
  z-index: 2147483647;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  font-size: 14px;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
  border: 1px solid #3b75db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: right 0.3s ease;
`

// Initialize tab visibility
chrome.storage.local.get(['showTab'], (result) => {
  tab.style.display = result.showTab !== false ? 'flex' : 'none'
})

// Create and setup iframe
const iframe = document.createElement('iframe')
iframe.id = 'chrome-ai-iframe'
iframe.style.cssText = `
  border: none;
  position: fixed;
  right: 0;
  top: 15px;
  height: calc(100vh - 30px);
  width: clamp(600px, 40vw, 800px);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 2147483647;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  pointer-events: auto;
  overflow: hidden;
`

// Initialize iframe content
const initializeIframe = async () => {
  // Get current dark mode setting
  const { isDarkMode } = await new Promise((resolve) => {
    chrome.storage.local.get(['isDarkMode'], resolve)
  })

  let iconStyles = `

    .chrome-ai-icon.copy {mask: url(${chrome.runtime.getURL(
      'icons/copy.svg'
    )}) no-repeat;}
    .chrome-ai-icon.file-plus {mask: url(${chrome.runtime.getURL(
      'icons/file-plus.svg'
    )}) no-repeat;}
    .chrome-ai-icon.file {mask: url(${chrome.runtime.getURL(
      'icons/file.svg'
    )}) no-repeat;}
    .chrome-ai-icon.globe {mask: url(${chrome.runtime.getURL(
      'icons/globe.svg'
    )}) no-repeat;}
    .chrome-ai-icon.scissors {mask: url(${chrome.runtime.getURL(
      'icons/scissors.svg'
    )}) no-repeat;}
    .chrome-ai-icon.settings {mask: url(${chrome.runtime.getURL(
      'icons/settings.svg'
    )}) no-repeat;}
    .chrome-ai-icon.close {mask: url(${chrome.runtime.getURL(
      'icons/x-circle.svg'
    )}) no-repeat;}
    .chrome-ai-icon.trash {mask: url(${chrome.runtime.getURL(
      'icons/trash-2.svg'
    )}) no-repeat;}
    .chrome-ai-icon.sun {mask: url(${chrome.runtime.getURL(
      'icons/sun.svg'
    )}) no-repeat;}
    .chrome-ai-icon.moon {mask: url(${chrome.runtime.getURL(
      'icons/moon.svg'
    )}) no-repeat;}
  `

  const doc = iframe.contentDocument
  const html = `
    <!DOCTYPE html>
    <html class="${isDarkMode ? 'dark-mode' : ''}">
      <head>
        <link rel="stylesheet" href="${chrome.runtime.getURL('styles.css')}">
        <style>${iconStyles}</style>
      </head>
      <body class="${isDarkMode ? 'dark-mode' : ''}">
        <div id="chrome-ai-root"></div>
      </body>
    </html>
  `

  // Replace document.write with safer DOM manipulation
  iframe.contentWindow.document.documentElement.innerHTML = html

  // Add escape key handler for iframe document
  iframe.contentDocument.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') {
        togglePanel(true)
        e.stopPropagation()
        e.preventDefault()
      }
    },
    true
  )

  const selectedText = window.getSelection().toString().trim()
  render(
    <ChatInterface
      hasSelection={Boolean(selectedText)}
      iconUrls={iconUrls}
      key={Date.now()}
      actions={actions || {}} // Ensure actions is an object
      initialDarkMode={isDarkMode} // Add this prop
    />,
    iframe.contentDocument.getElementById('chrome-ai-root')
  )
  focusInput()
}

// Root-level event listener for escape key
document.addEventListener(
  'keydown',
  (e) => {
    if (e.key === 'Escape') {
      const isOpen = iframe.style.transform === 'translateX(0px)'
      if (isOpen) {
        togglePanel(true)
        e.stopPropagation()
        e.preventDefault()
      }
    }
  },
  true
) // Use capture phase for highest priority

const focusInput = () => {
  const tryFocus = (attempts = 0) => {
    const input = iframe.contentDocument.querySelector('.chrome-ai-input')
    if (input) {
      setTimeout(() => input.focus(), 50)
      return
    }
    if (attempts < 10) {
      setTimeout(() => tryFocus(attempts + 1), 50)
    }
  }
  tryFocus()
}

const togglePanel = (forceClose = false) => {
  const isOpen = iframe.style.transform === 'translateX(0px)'

  // If forceClose is true, or if panel is open, close it
  if (forceClose || isOpen) {
    iframe.style.transform = 'translateX(100%)'
    tab.style.right = '0'
    return
  }

  // Get the current dark mode setting before rendering
  chrome.storage.local.get(['isDarkMode'], (result) => {
    const selectedText = window.getSelection().toString().trim()
    if (selectedText) {
      navigator.clipboard.writeText(selectedText)
    }

    render(
      <ChatInterface
        hasSelection={Boolean(selectedText)}
        iconUrls={iconUrls}
        actions={actions}
        key={Date.now()}
        initialDarkMode={result.isDarkMode || false}
      />,
      iframe.contentDocument.getElementById('chrome-ai-root')
    )
    focusInput()

    iframe.style.transform = 'translateX(0)'
    tab.style.right = iframe.getBoundingClientRect().width + 'px'
  })
}

// Simplified message listener
window.addEventListener(
  'message',
  (event) => {
    if (event.source !== iframe.contentWindow) return

    switch (event.data.type) {
      case 'themeChanged':
        iframe.contentDocument.documentElement.classList.toggle(
          'dark-mode',
          event.data.isDarkMode
        )
        break
      case 'settingsUpdated':
        tab.style.display = event.data.showTab ? 'flex' : 'none'
        break
      case 'closePanel':
        togglePanel(true)
        break
    }
  },
  false
)

tab.addEventListener('click', () => togglePanel())

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'toggle-panel') {
    togglePanel()
    sendResponse({ received: true })
  }
  return false
})

document.body.appendChild(tab)
document.body.appendChild(iframe)
initializeIframe()
