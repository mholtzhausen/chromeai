import { useRef, useState, useEffect } from 'preact/hooks'
import { ask } from '../chromeai.mjs'

export const ChatInterface = ({ hasSelection }) => {
  const inputRef = useRef(null)
  const [mode, setMode] = useState(hasSelection ? 'selection' : null)

  // Add effect to focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Add effect to update mode when hasSelection changes
  useEffect(() => {
    if (hasSelection) {
      setMode('selection')
    }
  }, [hasSelection])

  const toggleMode = (newMode) => {
    setMode(mode === newMode ? null : newMode)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const query = inputRef.current.value.trim()
    if (!query) return

    const context = {}
    if (mode === 'web') {
      context.web = document.body.innerText
    }
    if (mode === 'selection') {
      context.selection = window.getSelection().toString().trim()
    }

    await ask(query, context)
    inputRef.current.value = ''
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
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chrome-ai-input"
              placeholder="Type your message..."
            />
          </form>
        </div>
      </div>
    </div>
  )
}
