import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Baloo 2 — the stickery wordmark/body font. Load the weights the theme uses.
import '@fontsource/baloo-2/400.css'
import '@fontsource/baloo-2/500.css'
import '@fontsource/baloo-2/600.css'
import '@fontsource/baloo-2/700.css'
import './index.css'
import App from './App.jsx'
import { ThemeModeProvider } from './theme/ThemeModeProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeModeProvider>
      <App />
    </ThemeModeProvider>
  </StrictMode>,
)
