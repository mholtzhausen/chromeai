import { useRef, useState, useEffect } from 'preact/hooks'
import { queryAssistant } from '../chromeai.mjs'
import { models } from '../lib/openai.mjs'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true,
})

const LoadingDots = () => (
  <div className="chrome-ai-loading-dots">
    <span></span>
    <span></span>
    <span></span>
  </div>
)

const Message = ({
  content,
  role,
  id,
  isPinned,
  onDelete,
  onPin,
  iconUrls,
  isLoading,
  model,
}) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
  }

  const handlePinClick = (e) => {
    onPin(id, e.ctrlKey)
  }

  if (isLoading) {
    return (
      <div className={`chrome-ai-message ${role}`}>
        <LoadingDots />
      </div>
    )
  }

  return (
    <div className={`chrome-ai-message ${role}`}>
      <div
        className="chrome-ai-message-content markdown-body"
        dangerouslySetInnerHTML={{ __html: md.render(content) }}
      />
      <div className="chrome-ai-message-actions">
        <div className="chrome-ai-message-actions-left">
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
            class={
              isPinned ? 'chrome-ai-icon file-plus' : 'chrome-ai-icon file'
            }
          ></button>
        </div>
        {role === 'assistant' && model && (
          <div className="chrome-ai-message-model">{model}</div>
        )}
      </div>
    </div>
  )
}

const SettingsPanel = () => {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [systemMessage, setSystemMessage] = useState('')
  const [showTab, setShowTab] = useState(true)
  const [saveStatus, setSaveStatus] = useState('')
  const [availableModels, setAvailableModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  const [loadingModels, setLoadingModels] = useState(false)

  useEffect(() => {
    // Load saved settings on mount
    chrome.storage.local.get(
      [
        'openaiApiKey',
        'systemMessage',
        'showTab',
        'openaiBaseUrl',
        'selectedModel',
      ],
      (result) => {
        if (result.openaiApiKey) setApiKey(result.openaiApiKey)
        if (result.systemMessage) setSystemMessage(result.systemMessage)
        if (result.selectedModel) setSelectedModel(result.selectedModel)
        setShowTab(result.showTab !== false) // default to true if not set
        setBaseUrl(result.openaiBaseUrl || 'https://api.openai.com/v1')
      }
    )
  }, [])

  useEffect(() => {
    const loadModels = async () => {
      setLoadingModels(true)
      try {
        const modelList = await models()
        setAvailableModels(modelList)
      } catch (error) {
        console.error('Failed to load models:', error)
      } finally {
        setLoadingModels(false)
      }
    }

    if (apiKey) {
      loadModels()
    }
  }, [apiKey, baseUrl])

  const handleSaveSettings = () => {
    setSaveStatus('Saving...')

    // Apply API key immediately to window context
    if (typeof window !== 'undefined') {
      window.OPENAI_API_KEY = apiKey
    }

    chrome.storage.local.set(
      {
        openaiApiKey: apiKey,
        systemMessage: systemMessage,
        showTab: showTab,
        openaiBaseUrl: baseUrl,
        selectedModel: selectedModel,
      },
      () => {
        if (chrome.runtime.lastError) {
          setSaveStatus('Error saving settings!')
          console.error(chrome.runtime.lastError)
        } else {
          setSaveStatus('Saved!')
          // Dispatch event to notify content script
          window.parent.postMessage(
            {
              type: 'settingsUpdated',
              showTab,
              apiKey,
              baseUrl,
            },
            '*'
          )
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
        <label>OpenAI Base URL:</label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.openai.com/v1"
          autocomplete="off"
        />
      </div>
      <div className="chrome-ai-setting-group">
        <label>Default Model:</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={loadingModels}
        >
          {loadingModels ? (
            <option>Loading models...</option>
          ) : (
            availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))
          )}
        </select>
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
  initialDarkMode = false,
}) => {
  const inputRef = useRef(null)
  const selectRef = useRef(null)
  const messagesEndRef = useRef(null)
  const [mode, setMode] = useState(hasSelection ? 'selection' : null)
  const [showSettings, setShowSettings] = useState(false)
  const [messages, setMessages] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(initialDarkMode)
  const [isLoading, setIsLoading] = useState(false)

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
      const clickedMessage = messages.find((msg) => msg.id === id)
      const newPinState = !clickedMessage.isPinned
      setMessages(messages.map((msg) => ({ ...msg, isPinned: newPinState })))
    } else {
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
    if (!query || isLoading) return

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
    const { systemMessage, selectedModel } = await new Promise((resolve) => {
      chrome.storage.local.get(['systemMessage', 'selectedModel'], resolve)
    })

    // Add user message
    const userMessage = {
      id: Date.now(),
      content: query,
      role: 'user',
      isPinned: false,
    }

    // Add loading message
    const loadingMessage = {
      id: Date.now() + 1,
      content: '',
      role: 'assistant',
      isPinned: false,
      isLoading: true,
    }

    setMessages((prev) => [...prev, userMessage, loadingMessage])
    setIsLoading(true)
    inputRef.current.value = ''

    try {
      const response = await queryAssistant(
        query,
        context,
        systemMessage || 'You are a helpful assistant'
      )

      // Replace loading message with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                id: msg.id,
                content: response,
                role: 'assistant',
                isPinned: false,
                model: selectedModel || 'gpt-4',
              }
            : msg
        )
      )
    } catch (error) {
      console.error('Error getting response:', error)
      // Remove loading message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleActionChange = async (e) => {
    const actionKey = e.target.value
    if (!actionKey || isLoading) return

    const action = actions[actionKey]
    if (!action) return

    // Get saved system message and model
    const { systemMessage, selectedModel } = await new Promise((resolve) => {
      chrome.storage.local.get(['systemMessage', 'selectedModel'], resolve)
    })

    const context = {
      messages: messages
        .filter((msg) => msg.isPinned)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
    }

    if (action.includePage) {
      if (mode === 'selection') {
        context.selection = window.getSelection().toString().trim()
      } else {
        context.web = document.body.innerText
      }
    }

    const userMessage = {
      id: Date.now(),
      content: action.prompt,
      role: 'user',
      isPinned: false,
    }

    const loadingMessage = {
      id: Date.now() + 1,
      content: '',
      role: 'assistant',
      isPinned: false,
      isLoading: true,
    }

    setMessages((prev) => [...prev, userMessage, loadingMessage])
    setIsLoading(true)

    try {
      const response = await queryAssistant(
        action.prompt,
        context,
        [action.system || '', systemMessage || ''].join('\n')
      )

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                id: msg.id,
                content: response,
                role: 'assistant',
                isPinned: false,
                model: selectedModel || 'gpt-4',
              }
            : msg
        )
      )
    } catch (error) {
      console.error('Error getting response:', error)
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessage.id))
    } finally {
      setIsLoading(false)
      if (selectRef.current) {
        selectRef.current.value = ''
      }
    }
  }

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)

    // Update both HTML and body elements of the iframe
    const doc =
      window.parent.document.getElementById('chrome-ai-iframe').contentDocument
    doc.documentElement.classList.toggle('dark-mode', newTheme)
    doc.body.classList.toggle('dark-mode', newTheme)

    // Notify parent frame
    window.parent.postMessage(
      {
        type: 'themeChanged',
        isDarkMode: newTheme,
      },
      '*'
    )

    // Save to storage
    chrome.storage.local.set({ isDarkMode: newTheme })
  }

  const clearMessages = () => {
    setMessages([])
    chrome.storage.local.set({ messages: [] })
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
                <select
                  ref={selectRef}
                  onChange={handleActionChange}
                  disabled={isLoading}
                >
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
                    disabled={isLoading}
                  ></button>
                  <button
                    className={`chrome-ai-toggle-button chrome-ai-icon scissors ${
                      mode === 'selection' ? 'active' : ''
                    } ${!hasSelection ? 'disabled' : ''}`}
                    onClick={() => hasSelection && toggleMode('selection')}
                    disabled={!hasSelection || isLoading}
                  ></button>
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  className="chrome-ai-input"
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
