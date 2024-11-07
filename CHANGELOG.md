# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2024

### Enhanced

- Fix OpenAI API base URL in SettingsPanel and update placeholder text
- Fix dark-mode toggle apply immediately

## [1.2.0] - 2024

### Added

- OpenAI base URL configuration in settings panel
- Model selection dropdown in settings panel that loads available models from API
- Model information display in message actions bar
- Automatic model list refresh when API key or base URL changes

### Enhanced

- Message actions bar layout with left-aligned buttons and right-aligned model info
- Settings panel organization to include API configuration options
- Storage handling to persist base URL and selected model preferences
- Message storage to include model information with each response

## [1.1.0] - 2024

### Added

- Loading animation styles in ChatInterface for better user feedback
- Comprehensive scroll lock mechanism for chat container
- Message pinning functionality with context support
- Tab visibility settings for improved user experience

### Enhanced

- Added loading animation in assistant's reply bubble while waiting for API responses
- Disabled input and action buttons during API calls to prevent multiple submissions
- Action bar now uses selected text instead of full page context when text is selected and selection mode is active
- Improved context handling in ChatInterface to respect user's selection mode
- Container and panel styles for better visual hierarchy
- Scrollbar styles for improved usability
- Message layout and organization
- Iframe width adjustments for better display

### Updated

- Upgraded Preact to version 10.24.3
- Updated Vite to version 5.4.10
- Updated OpenAI SDK to version 4.70.2
- Updated markdown-it to version 14.1.0

### Refactored

- CSS organization and styling rules
- Message clearing functionality
- File paths structure

## [1.0.0] - 2024

### Added

- Settings panel for API key management
- Markdown rendering support using markdown-it
- Message pinning functionality
- Dark mode support
- New icon resources (file, copy, globe, scissors, trash, settings)
- Storage permission for persistent settings
- Button bar for mode selection

### Enhanced

- Project configuration with Prettier and ESLint
- Background script error handling
- Content script management
- Chat container scroll lock mechanism
- Tab visibility settings
- Message layout and styles
- Settings panel with save status feedback
- Container and panel styles
- Iframe width adjustments
- Message storage implementation

### Refactored

- Project structure to use ES modules
- Focus handling in ChatInterface
- Query handling system
- CSS organization and styling
- File paths and directory structure
- Message clearing functionality

### Developer Experience

- Added new dependencies
- Improved error handling
- Enhanced code organization
- Updated .gitignore configuration
