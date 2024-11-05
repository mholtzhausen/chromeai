// Store connected ports
const ports = new Set()

// Port connection management
chrome.runtime.onConnect.addListener((port) => {
  try {
    ports.add(port)
    port.onDisconnect.addListener(() => {
      ports.delete(port)
    })
  } catch (error) {
    console.error('Error handling port connection:', error)
  }
})

// Inject content script if not already present
async function ensureContentScriptLoaded(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return window.hasOwnProperty('ChromeAIContent')
      }
    })
  } catch (error) {
    // If script check fails, inject the content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    })
    // Wait a bit for the script to initialize
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

// Command listener for panel toggle
chrome.commands.onCommand.addListener(async (command) => {
  try {
    if (command === 'toggle-panel') {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })

      if (!activeTab?.id) {
        console.warn('No active tab found')
        return
      }

      // Ensure content script is loaded
      await ensureContentScriptLoaded(activeTab.id)

      // Send toggle message
      await chrome.tabs.sendMessage(activeTab.id, {
        command: 'toggle-panel'
      }).catch((error) => {
        console.error('Error sending toggle message:', error)
      })
    }
  } catch (error) {
    console.error('Error handling command:', error)
  }
})

// Cleanup function for extension unload
chrome.runtime.onSuspend.addListener(() => {
  try {
    ports.clear()
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
})
