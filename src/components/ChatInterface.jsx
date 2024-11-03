import { useRef, useState } from 'preact/hooks'

export const ChatInterface = ({ hasSelection }) => {
  const inputRef = useRef(null)
  const [mode, setMode] = useState(null) // null, 'web' or 'selection'

  const toggleMode = (newMode) => {
    setMode(mode === newMode ? null : newMode)
  }

  return (
    <div className="chrome-ai-container">
      <div className="chrome-ai-panel">
        <div className="chrome-ai-header">ChromeAi</div>
        <div className="chrome-ai-chat-container">
          {/* Chat messages will go here */}
        </div>
        <div className="chrome-ai-input-container">
          <div className="chrome-ai-button-bar">
            <button
              className={`chrome-ai-toggle-button ${
                mode === 'web' ? 'active' : ''
              }`}
              onClick={() => toggleMode('web')}
            >
              🌐
            </button>
            <button
              className={`chrome-ai-toggle-button ${
                mode === 'selection' ? 'active' : ''
              } ${!hasSelection ? 'disabled' : ''}`}
              onClick={() => hasSelection && toggleMode('selection')}
              disabled={!hasSelection}
            >
              ✂️
            </button>
          </div>
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
