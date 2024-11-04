import { render } from 'preact'
import { ChatInterface } from './components/ChatInterface'

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
  `

  const doc = iframe.contentDocument
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="${chrome.runtime.getURL('styles.css')}">
        <style>${iconStyles}</style>
      </head>
      <body>
        <div id="chrome-ai-root"></div>
        <script>
          // Comprehensive scroll lock
          document.addEventListener('wheel', (e) => {
            const target = e.target;
            const scrollable = target.closest('.chrome-ai-chat-container');
            if (!scrollable) {
              e.preventDefault();
              return;
            }
            
            const scrollTop = scrollable.scrollTop;
            const scrollHeight = scrollable.scrollHeight;
            const height = scrollable.clientHeight;
            const delta = e.deltaY;
            
            // Prevent scroll when at boundaries
            if ((delta > 0 && scrollTop + height >= scrollHeight) ||
                (delta < 0 && scrollTop <= 0)) {
              e.preventDefault();
            }
            
            // Stop propagation in all cases
            e.stopPropagation();
          }, { passive: false, capture: true });

          // Prevent scrolling main page when reaching boundaries
          document.addEventListener('touchstart', (e) => {
            const target = e.target;
            if (!target.closest('.chrome-ai-chat-container')) {
              e.preventDefault();
            }
          }, { passive: false });
        </script>
      </body>
    </html>
  `

  // Replace document.write with safer DOM manipulation
  iframe.contentWindow.document.documentElement.innerHTML = html

  const selectedText = window.getSelection().toString().trim()
  render(
    <ChatInterface
      hasSelection={Boolean(selectedText)}
      iconUrls={iconUrls}
      key={Date.now()}
    />,
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
      <ChatInterface
        hasSelection={Boolean(selectedText)}
        iconUrls={iconUrls}
        key={Date.now()}
      />,
      iframe.contentDocument.getElementById('chrome-ai-root')
    )
    focusInput()
  }

  // Update position considering the fixed width
  iframe.style.transform = isOpen ? 'translateX(100%)' : 'translateX(0)'
  tab.style.right = isOpen ? '0' : iframe.getBoundingClientRect().width + 'px'
}

tab.addEventListener('click', togglePanel)

// Listen for settings updates from iframe
window.addEventListener('message', (event) => {
  if (event.data.type === 'settingsUpdated') {
    tab.style.display = event.data.showTab ? 'flex' : 'none'
  }
})

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
