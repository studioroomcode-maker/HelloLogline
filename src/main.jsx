import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSentry } from './sentry.js'
import LoglineAnalyzer from './logline-analyzer'
import ShareView from './ShareView.jsx'

initSentry()

// 공유 링크 라우팅: /share/<8자리 hex>
const _sharePath = window.location.pathname.match(/^\/share\/([a-f0-9]{8})$/)

if (_sharePath) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ShareView shareId={_sharePath[1]} />
    </StrictMode>,
  )
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <LoglineAnalyzer />
    </StrictMode>,
  )
}
