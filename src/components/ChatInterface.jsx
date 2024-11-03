import { useState, useEffect, useRef } from 'preact/hooks'

export const ChatInterface = () => {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleMessage = (message) => {
      console.log('Message received:', message)
      if (message.command === 'toggle-panel') {
        setIsOpen((prev) => !prev)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className={`chrome-ai-container ${isOpen ? 'open' : ''}`}>
      <div className="chrome-ai-panel">
        <div className="chrome-ai-header">ChromeAi</div>
        <div className="chrome-ai-chat-container">
          {/* Chat messages will go here */}
        </div>
        <div className="chrome-ai-input-container">
          <input
            ref={inputRef}
            type="text"
            className="chrome-ai-input"
            placeholder="Type your message..."
          />
        </div>
      </div>
      <div className="chrome-ai-tab" onClick={() => setIsOpen((prev) => !prev)}>
        AI Chat
      </div>
    </div>
  )
}
