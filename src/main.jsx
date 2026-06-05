import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/styles/tokens.css'
import './shared/styles/base.css'
import './shared/styles/legacy-compat.css'
import './shared/styles/admin-flat.css'
import './shared/styles/public-showcase.css'
import './shared/styles/mobile.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
