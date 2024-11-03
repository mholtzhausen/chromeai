import { useRef, useState, useEffect } from 'preact/hooks'
import { ask } from '../chromeai.mjs'

const SettingsPanel = () => {
  const [apiKey, setApiKey] = useState('')
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    // Load saved API key on mount
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        setApiKey(result.openaiApiKey)
      }
    })
  }, [])

  const handleSaveApiKey = () => {
    setSaveStatus('Saving...')
    chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
      if (chrome.runtime.lastError) {
        setSaveStatus('Error saving key!')
        console.error(chrome.runtime.lastError)
      } else {
        setSaveStatus('Saved!')
        setTimeout(() => setSaveStatus(''), 2000)
      }
    })
  }

  return (
    <div className="chrome-ai-settings">
      <h3>Settings</h3>
      <div className="chrome-ai-setting-group">
        <label>OpenAI API Key:</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          autocomplete="off"
        />
        <div className="chrome-ai-setting-actions">
          <button
            onClick={handleSaveApiKey}
            disabled={saveStatus === 'Saving...'}
          >
            Save
          </button>
          {saveStatus && (
            <span
              className={`chrome-ai-save-status ${
                saveStatus === 'Error saving key!' ? 'error' : ''
              }`}
            >
              {saveStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export const ChatInterface = ({ hasSelection }) => {
  const inputRef = useRef(null)
  const [mode, setMode] = useState(hasSelection ? 'selection' : null)
  const [showSettings, setShowSettings] = useState(false)

  // Remove the focus effect since we handle it in content.jsx
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
        <div className="chrome-ai-header">
          <span>ChromeAi</span>
          <button
            className="chrome-ai-settings-button"
            onClick={() => setShowSettings(!showSettings)}
            title={showSettings ? 'Close settings' : 'Open settings'}
          >
            {showSettings ? '✕' : '⚙️'}
          </button>
        </div>
        {showSettings ? (
          <SettingsPanel />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
