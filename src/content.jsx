import { render } from 'preact'
import { ChatInterface } from './components/ChatInterface'

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

// Create and setup iframe
const iframe = document.createElement('iframe')
iframe.id = 'chrome-ai-iframe'
iframe.style.cssText = `
  border: none;
  position: fixed;
  right: 0;
  top: 15px;
  height: calc(100vh - 30px);
  width: min(40vw, 800px);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 2147483647;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
`

// Initialize iframe content
const initializeIframe = async () => {
  const styleText = await fetch(chrome.runtime.getURL('styles.css')).then((r) =>
    r.text()
  )

  const doc = iframe.contentDocument
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            margin: 0; 
            padding: 0;
            height: 100vh;
            overflow: hidden;
          }
          ${styleText}
        </style>
      </head>
      <body>
        <div id="chrome-ai-root"></div>
      </body>
    </html>
  `

  // Replace document.write with safer DOM manipulation
  iframe.contentWindow.document.documentElement.innerHTML = html

  const selectedText = window.getSelection().toString().trim()
  render(
    <ChatInterface hasSelection={Boolean(selectedText)} key={Date.now()} />,
    iframe.contentDocument.getElementById('chrome-ai-root')
  )
  focusInput()
}

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

const togglePanel = () => {
  const isOpen = iframe.style.transform === 'translateX(0px)'
  const selectedText = window.getSelection().toString().trim()

  if (!isOpen) {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText)
    }
    render(
      <ChatInterface hasSelection={Boolean(selectedText)} key={Date.now()} />,
      iframe.contentDocument.getElementById('chrome-ai-root')
    )
    focusInput()
  }

  iframe.style.transform = isOpen ? 'translateX(100%)' : 'translateX(0px)'
  tab.style.right = isOpen ? '0' : iframe.offsetWidth + 'px'
}

tab.addEventListener('click', togglePanel)

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
