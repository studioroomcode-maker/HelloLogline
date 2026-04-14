import { Component } from "react";
import { Sentry } from "./sentry.js";

function isChunkLoadError(error) {
  return (
    error?.message?.includes("dynamically imported module") ||
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("Importing a module script failed") ||
    error?.name === "ChunkLoadError"
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, reloading: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    try {
      Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    } catch (_) {
      // Sentry 미초기화 시 무시
    }

    // 청크 로드 실패는 자동 새로고침 (lazyWithRetry에서 처리 못한 경우 대비)
    if (isChunkLoadError(error)) {
      const alreadyRetried = sessionStorage.getItem("hll-chunk-reload");
      if (!alreadyRetried) {
        sessionStorage.setItem("hll-chunk-reload", "1");
        this.setState({ reloading: true });
        // 짧은 딜레이 후 새로고침 (setState가 반영된 후)
        setTimeout(() => window.location.reload(), 300);
      }
    }
  }

  componentDidMount() {
    // 새로고침 후 정상 동작 시 sessionStorage 플래그 제거
    if (!this.state.hasError) {
      sessionStorage.removeItem("hll-chunk-reload");
    }
  }

  reset = () => this.setState({ hasError: false, error: null, reloading: false });

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isChunk = isChunkLoadError(this.state.error);
    const alreadyRetried = sessionStorage.getItem("hll-chunk-reload");

    // 청크 에러이고 아직 재시도하지 않은 경우 → 새로고침 중 표시
    if (isChunk && (!alreadyRetried || this.state.reloading)) {
      return (
        <div style={{
          margin: "16px 0", padding: "20px 22px", borderRadius: 12,
          background: "rgba(78,204,163,0.08)", border: "1.5px solid rgba(78,204,163,0.3)",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #4ECCA3", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 13, color: "#4ECCA3" }}>앱이 업데이트됐습니다. 자동으로 새로고침 중…</div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // 청크 에러이고 이미 새로고침했는데도 실패한 경우 → 수동 버튼
    if (isChunk) {
      return (
        <div style={{
          margin: "16px 0", padding: "20px 22px", borderRadius: 12,
          background: "rgba(232,93,117,0.12)", border: "1.5px solid rgba(232,93,117,0.45)",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E85D75", marginBottom: 8 }}>
            이 단계를 불러오지 못했습니다
          </div>
          <div style={{ fontSize: 12, color: "rgba(232,93,117,0.8)", marginBottom: 14, lineHeight: 1.6 }}>
            네트워크 상태를 확인하고 다시 시도해주세요.
          </div>
          <button
            onClick={() => { sessionStorage.removeItem("hll-chunk-reload"); window.location.reload(); }}
            style={{
              padding: "7px 16px", borderRadius: 8,
              border: "1px solid rgba(232,93,117,0.5)",
              background: "rgba(232,93,117,0.15)", color: "#E85D75",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }

    // 일반 에러 → 기존 동작 유지
    return (
      <div style={{
        margin: "16px 0", padding: "20px 22px", borderRadius: 12,
        background: "rgba(232,93,117,0.12)", border: "1.5px solid rgba(232,93,117,0.45)",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E85D75" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#E85D75" }}>
            이 단계를 불러오는 중 오류가 발생했습니다
          </div>
        </div>
        <div style={{
          fontSize: 12, color: "rgba(232,93,117,0.85)", marginBottom: 14,
          wordBreak: "break-word", lineHeight: 1.6, paddingLeft: 24,
        }}>
          {this.state.error?.message || "알 수 없는 오류가 발생했습니다."}
        </div>
        <div style={{ paddingLeft: 24 }}>
          <button
            onClick={this.reset}
            style={{
              padding: "7px 16px", borderRadius: 8,
              border: "1px solid rgba(232,93,117,0.5)",
              background: "rgba(232,93,117,0.15)", color: "#E85D75",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }
}
