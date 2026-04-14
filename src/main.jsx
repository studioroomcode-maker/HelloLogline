import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSentry } from './sentry.js'
import LoglineAnalyzer from './logline-analyzer'
import ShareView from './ShareView.jsx'

initSentry()

// ── 서비스워커 업데이트 자동 새로고침 ─────────────────────────────
// 새 빌드가 배포되면 서비스워커가 교체(controllerchange)된다.
// 이 순간 기존 청크 URL이 무효화되므로, 에러가 발생하기 전에
// 미리 페이지를 새로고침해 최신 빌드를 로드한다.
if ('serviceWorker' in navigator) {
  let reloadScheduled = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadScheduled) return
    reloadScheduled = true

    // 작업 중인 내용이 저장될 수 있도록 짧은 여유 후 새로고침
    const bar = document.createElement('div')
    bar.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:2147483647',
      'background:#4ECCA3', 'color:#0a0f0d',
      'display:flex', 'align-items:center', 'justify-content:center', 'gap:8px',
      'padding:10px 20px', 'font-family:sans-serif', 'font-size:13px', 'font-weight:600',
      'letter-spacing:0.2px', 'box-shadow:0 2px 8px rgba(0,0,0,0.3)',
    ].join(';')
    bar.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> 앱이 업데이트되었습니다. 잠시 후 자동으로 새로고침됩니다…'
    document.body?.appendChild(bar)

    setTimeout(() => window.location.reload(), 1500)
  })
}
// ────────────────────────────────────────────────────────────────

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
