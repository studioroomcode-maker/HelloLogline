import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary from './ErrorBoundary.jsx'
import StudentChecker from './StudentChecker.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <StudentChecker />
    </ErrorBoundary>
  </StrictMode>,
)
