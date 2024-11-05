import { useRef, useState, useEffect } from 'preact/hooks'
import { queryAssistant } from '../chromeai.mjs'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true,
})

const Message = ({
  content,
  role,
  id,
  isPinned,
  onDelete,
  onPin,
  iconUrls,
}) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
  }

  const handlePinClick = (e) => {
    onPin(id, e.ctrlKey)
  }

  return (
    <div className={`chrome-ai-message ${role}`}>
      <div
        className="chrome-ai-message-content markdown-body"
        dangerouslySetInnerHTML={{ __html: md.render(content) }}
      />
      <div className="chrome-ai-message-actions">
        <button
          class="chrome-ai-icon copy"
          onClick={copyToClipboard}
          title="Copy message"
        ></button>
        <button
          class="chrome-ai-icon trash"
          onClick={() => onDelete(id)}
          title="Delete message"
        ></button>
        <button
          onClick={handlePinClick}
          title={`${
            isPinned ? 'Unpin' : 'Pin'
          } message (CTRL+click to toggle all)`}
          class={isPinned ? 'chrome-ai-icon file-plus' : 'chrome-ai-icon file'}
        ></button>
      </div>
    </div>
  )
}

const SettingsPanel = () => {
  const [apiKey, setApiKey] = useState('')
  const [systemMessage, setSystemMessage] = useState('')
  const [showTab, setShowTab] = useState(true)
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    // Load saved settings on mount
    chrome.storage.local.get(
      ['openaiApiKey', 'systemMessage', 'showTab'],
      (result) => {
        if (result.openaiApiKey) setApiKey(result.openaiApiKey)
        if (result.systemMessage) setSystemMessage(result.systemMessage)
        setShowTab(result.showTab !== false) // default to true if not set
      }
    )
  }, [])

  const handleSaveSettings = () => {
    setSaveStatus('Saving...')
    chrome.storage.local.set(
      {
        openaiApiKey: apiKey,
        systemMessage: systemMessage,
        showTab: showTab,
      },
      () => {
        if (chrome.runtime.lastError) {
          setSaveStatus('Error saving settings!')
          console.error(chrome.runtime.lastError)
        } else {
          setSaveStatus('Saved!')
          // Dispatch event to notify content script
          window.parent.postMessage({ type: 'settingsUpdated', showTab }, '*')
          setTimeout(() => setSaveStatus(''), 2000)
        }
      }
    )
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
      </div>
      <div className="chrome-ai-setting-group">
        <label>Default System Message:</label>
        <textarea
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          placeholder="Enter the default system message..."
          className="chrome-ai-textarea"
          rows={4}
        />
      </div>
      <div className="chrome-ai-setting-group">
        <label className="chrome-ai-checkbox-label">
          <input
            type="checkbox"
            checked={showTab}
            onChange={(e) => setShowTab(e.target.checked)}
            className="chrome-ai-checkbox"
          />
          Show activation tab
        </label>
      </div>
      <div className="chrome-ai-setting-actions">
        <button
          onClick={handleSaveSettings}
          disabled={saveStatus === 'Saving...'}
        >
          Save All Settings
        </button>
        {saveStatus && (
          <span
            className={`chrome-ai-save-status ${
              saveStatus === 'Error saving settings!' ? 'error' : ''
            }`}
          >
            {saveStatus}
          </span>
        )}
      </div>
    </div>
  )
}

export const ChatInterface = ({
  hasSelection,
  iconUrls,
  actions = {},
  initialDarkMode = false, // Add this prop
}) => {
  const inputRef = useRef(null)
  const selectRef = useRef(null)
  const messagesEndRef = useRef(null)
  const [mode, setMode] = useState(hasSelection ? 'selection' : null)
  const [showSettings, setShowSettings] = useState(false)
  const [messages, setMessages] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(initialDarkMode) // Use initial value

  // Replace the dark mode effect with one that only updates classes
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    if (hasSelection) {
      setMode('selection')
    }
  }, [hasSelection])

  useEffect(() => {
    // Load messages on mount
    chrome.storage.local.get(['messages'], (result) => {
      if (result.messages) {
        setMessages(result.messages)
      }
    })
  }, [])

  useEffect(() => {
    // Save messages when they change
    chrome.storage.local.set({ messages })
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleMode = (newMode) => {
    setMode(mode === newMode ? null : newMode)
  }

  const handleDeleteMessage = (id) => {
    setMessages(messages.filter((msg) => msg.id !== id))
  }

  const handlePinMessage = (id, toggleAll = false) => {
    if (toggleAll) {
      // Find the clicked message's current pin status
      const clickedMessage = messages.find((msg) => msg.id === id)
      const newPinState = !clickedMessage.isPinned

      // Toggle all messages to the opposite of clicked message's original state
      setMessages(messages.map((msg) => ({ ...msg, isPinned: newPinState })))
    } else {
      // Toggle single message
      setMessages(
        messages.map((msg) =>
          msg.id === id ? { ...msg, isPinned: !msg.isPinned } : msg
        )
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const query = inputRef.current.value.trim()
    if (!query) return

    const context = {
      messages: messages
        .filter((msg) => msg.isPinned)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
    }

    if (mode === 'web') {
      context.web = document.body.innerText
    }
    if (mode === 'selection') {
      context.selection = window.getSelection().toString().trim()
    }

    // Get saved system message
    const { systemMessage } = await new Promise((resolve) => {
      chrome.storage.local.get(['systemMessage'], resolve)
    })

    // Add user message with unique id and isPinned false
    const userMessage = {
      id: Date.now(),
      content: query,
      role: 'user',
      isPinned: false,
    }
    setMessages((prev) => [...prev, userMessage])

    // Get AI response with system message
    const response = await queryAssistant(
      query,
      context,
      systemMessage || 'You are a helpful assistant'
    )

    // Add assistant message with unique id and isPinned false
    const assistantMessage = {
      id: Date.now() + 1,
      content: response,
      role: 'assistant',
      isPinned: false,
    }
    setMessages((prev) => [...prev, assistantMessage])

    inputRef.current.value = ''
  }

  const clearMessages = () => {
    setMessages([])
    chrome.storage.local.set({ messages: [] })
  }

  const handleActionChange = async (e) => {
    const actionKey = e.target.value
    const action = actions[actionKey]
    if (!action) return

    const context = {
      messages: messages
        .filter((msg) => msg.isPinned)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
    }

    if (action.includePage) {
      context.web = document.body.innerText
    }

    const userMessage = {
      id: Date.now(),
      content: action.prompt,
      role: 'user',
      isPinned: false,
    }
    setMessages((prev) => [...prev, userMessage])

    const response = await queryAssistant(
      action.prompt,
      context,
      action.system || 'You are a helpful assistant'
    )

    const assistantMessage = {
      id: Date.now() + 1,
      content: response,
      role: 'assistant',
      isPinned: false,
    }
    setMessages((prev) => [...prev, assistantMessage])

    // Reset select box to default option
    if (selectRef.current) {
      selectRef.current.value = ''
    }
  }

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)

    // Notify parent frame about theme change
    window.parent.postMessage(
      {
        type: 'themeChanged',
        isDarkMode: newTheme,
      },
      '*'
    )

    // Update storage
    chrome.storage.local.set({ isDarkMode: newTheme })
  }

  return (
    <div className="chrome-ai-container">
      <div className="chrome-ai-panel">
        <div className="chrome-ai-header">
          <span>ChromeAi</span>
          <div className="chrome-ai-header-buttons">
            <button
              className={`chrome-ai-header-button chrome-ai-icon ${
                isDarkMode ? 'moon' : 'sun'
              }`}
              onClick={toggleTheme}
              title={
                isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
              }
            ></button>
            <button
              className={`chrome-ai-header-button chrome-ai-icon trash ${
                showSettings ? 'hidden' : ''
              }`}
              onClick={clearMessages}
              title="Clear messages"
            ></button>
            <button
              className={`chrome-ai-header-button chrome-ai-icon ${
                showSettings ? 'close' : 'settings'
              }`}
              onClick={() => setShowSettings(!showSettings)}
              title={showSettings ? 'Close settings' : 'Open settings'}
            ></button>
          </div>
        </div>
        {showSettings ? (
          <SettingsPanel />
        ) : (
          <>
            <div className="chrome-ai-chat-container">
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  {...msg}
                  onDelete={handleDeleteMessage}
                  onPin={handlePinMessage}
                  iconUrls={iconUrls}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="chrome-ai-input-container">
              <div className="chrome-ai-button-bar">
                <select ref={selectRef} onChange={handleActionChange}>
                  <option value="">Select an action</option>
                  {Object.keys(actions).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
                <div className="buttons-group">
                  <button
                    className={`chrome-ai-toggle-button chrome-ai-icon globe ${
                      mode === 'web' ? 'active' : ''
                    }`}
                    onClick={() => toggleMode('web')}
                  ></button>
                  <button
                    className={`chrome-ai-toggle-button chrome-ai-icon scissors ${
                      mode === 'selection' ? 'active' : ''
                    } ${!hasSelection ? 'disabled' : ''}`}
                    onClick={() => hasSelection && toggleMode('selection')}
                    disabled={!hasSelection}
                  ></button>
                </div>
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
