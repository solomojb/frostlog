import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/cinzel/400.css'
import '@fontsource/cinzel/600.css'
import '@fontsource/cinzel/700.css'
import '@fontsource/crimson-pro/300.css'
import '@fontsource/crimson-pro/400.css'
import '@fontsource/crimson-pro/300-italic.css'
import '@fontsource/crimson-pro/400-italic.css'
import './index.css'
import App from './App.jsx'
import { initStorage } from './utils/storage.js'


if (window.__TAURI_INTERNALS__) {
  document.addEventListener('contextmenu', e => e.preventDefault());
}

initStorage().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
