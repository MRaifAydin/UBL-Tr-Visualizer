import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { DocumentProvider } from './context/DocumentContext'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element bulunamadı')

createRoot(rootElement).render(
  <StrictMode>
    <DocumentProvider>
      <App />
    </DocumentProvider>
  </StrictMode>,
)
