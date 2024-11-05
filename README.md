# ChromeAI Extension

A Chrome extension that provides AI-powered chat interface for web browsing assistance.

## Features

- AI Chat Interface with GPT-4 integration
- Context-aware responses based on webpage content
- Text selection analysis
- Dark/Light mode support
- Customizable system messages
- Message pinning and history
- Quick actions for common tasks

## Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/chromeai.git
cd chromeai
```

2. Install dependencies

```bash
npm install
```

3. Build the extension

```bash
npm run build
```

4. Load the extension in Chrome

- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` directory from the project

## Development

- Run development build with watch mode:

```bash
npm run dev
```

- Clean build directory:

```bash
npm run clean
```

## Configuration

1. Open the extension
2. Click the settings icon
3. Enter your OpenAI API key
4. Customize the default system message (optional)
5. Toggle the activation tab visibility

## Usage

- Press `Alt+A` to toggle the chat panel
- Use the globe icon to include current page context
- Use the scissors icon to include selected text
- Pin messages to maintain context in future queries
- Use quick actions for common tasks like summarization

## Project Structure

```
chromeai/
├── src/
│   ├── background.js    # Chrome extension background script
│   ├── content.jsx      # Content script with UI injection
│   ├── chromeai.mjs     # Core AI interaction logic
│   ├── components/      # React components
│   └── lib/            # Utility functions and API handlers
├── public/
│   ├── styles.css      # Global styles
│   └── icons/          # UI icons
└── dist/               # Built extension files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
