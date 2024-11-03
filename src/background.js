let ports = new Set()

chrome.runtime.onConnect.addListener((port) => {
  ports.add(port)
  port.onDisconnect.addListener(() => ports.delete(port))
})

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-panel') {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'toggle-panel' }).catch(() => {
        // Handle any errors silently
      })
    }
  }
})
