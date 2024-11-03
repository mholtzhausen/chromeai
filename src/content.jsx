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
  top: 0;
  height: 100vh;
  width: 400px;
  transform: translateX(400px);
  transition: transform 0.3s ease;
  z-index: 2147483647;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
`

// Initialize iframe content
const initializeIframe = async () => {
  const styleText = await fetch(chrome.runtime.getURL('styles.css')).then((r) =>
    r.text()
  )

  iframe.contentDocument.write(`
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
  `)
  iframe.contentDocument.close()
  const selectedText = window.getSelection().toString().trim()
  render(
    <ChatInterface hasSelection={Boolean(selectedText)} />,
    iframe.contentDocument.getElementById('chrome-ai-root')
  )
}

const togglePanel = () => {
  const isOpen = iframe.style.transform === 'translateX(0px)'
  const selectedText = window.getSelection().toString().trim()

  if (!isOpen) {
    // Re-render with current selection state
    render(
      <ChatInterface hasSelection={Boolean(selectedText)} />,
      iframe.contentDocument.getElementById('chrome-ai-root')
    )
  }

  if (!isOpen) {
    // Handle text selection when opening
    const selectedText = window.getSelection().toString().trim()
    if (selectedText) {
      navigator.clipboard.writeText(selectedText)
    }
  }

  iframe.style.transform = isOpen ? 'translateX(400px)' : 'translateX(0px)'
  tab.style.right = isOpen ? '0' : '400px'

  // Focus input when opening
  if (!isOpen) {
    // Small delay to ensure iframe content is ready
    setTimeout(() => {
      const input = iframe.contentDocument.querySelector('.chrome-ai-input')
      if (input) {
        input.focus()
      }
    }, 300)
  }
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