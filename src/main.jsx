import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LoglineAnalyzer from './logline-analyzer'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoglineAnalyzer />
  </StrictMode>,
)
