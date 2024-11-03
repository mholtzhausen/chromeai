import { h, render } from 'preact'
import { ChatInterface } from './components/ChatInterface'

const mount = document.createElement('div')
mount.id = 'chrome-ai-root'
document.body.appendChild(mount)

render(<ChatInterface />, mount)
