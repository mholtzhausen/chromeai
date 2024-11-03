import { useRef } from 'preact/hooks'

export const ChatInterface = () => {
  const inputRef = useRef(null)

  return (
    <div className="chrome-ai-container">
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
    </div>
  )
}
