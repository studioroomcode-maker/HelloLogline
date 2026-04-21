import { Component } from "react";
import { Sentry } from "./sentry.js";

/**
 * Per-stage error boundary. Isolates crashes to a single stage panel —
 * does not auto-reload (preserving all other stage state).
 */
export class StageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[Stage ${this.props.stageId ?? "?"} Error]`, error, info.componentStack);
    try {
      Sentry.captureException(error, {
        extra: { stageId: this.props.stageId, componentStack: info.componentStack },
      });
    } catch (_) {}
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const stageName = this.props.stageName ?? `Stage ${this.props.stageId ?? ""}`;

    return (
      <div style={{
        margin: "24px auto", maxWidth: 680, padding: "20px 24px", borderRadius: 12,
        background: "rgba(232,93,117,0.09)", border: "1.5px solid rgba(232,93,117,0.35)",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E85D75" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#E85D75" }}>
            {stageName}을(를) 불러오지 못했어요
          </div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(232,93,117,0.8)", marginBottom: 6, lineHeight: 1.6, paddingLeft: 24 }}>
          다른 단계의 작업은 영향받지 않았어요. 아래 "다시 시도"를 눌러 주세요.
        </div>
        <div style={{ fontSize: 11, color: "rgba(232,93,117,0.55)", marginBottom: 14, lineHeight: 1.6, paddingLeft: 24, wordBreak: "break-word", fontFamily: "'JetBrains Mono', monospace" }}>
          {this.state.error?.message || "알 수 없는 오류"}
        </div>
        <div style={{ paddingLeft: 24 }}>
          <button
            onClick={this.reset}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(232,93,117,0.45)", background: "rgba(232,93,117,0.12)", color: "#E85D75", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }
}

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
    } catch (_) {}

    // 청크 에러 최후 방어: main.jsx의 controllerchange 또는 lazyWithRetry에서
    // 처리 못한 경우 여기서 한 번 더 자동 새로고침 시도
    if (isChunkLoadError(error)) {
      const key = "hll-chunk-reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        setTimeout(() => window.location.reload(), 300);
      }
    }
  }

  componentDidMount() {
    // 정상 마운트 시 재시도 플래그 초기화
    if (!this.state.hasError) sessionStorage.removeItem("hll-chunk-reload");
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const isChunk = isChunkLoadError(this.state.error);

    // 청크 에러 → 조용히 새로고침 중이거나 아직 시도 전: 최소한의 안내만 표시
    if (isChunk) {
      return (
        <div style={{
          margin: "16px 0", padding: "16px 20px", borderRadius: 10,
          background: "rgba(78,204,163,0.07)", border: "1px solid rgba(78,204,163,0.25)",
          display: "flex", alignItems: "center", gap: 10,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          <div style={{ width: 14, height: 14, flexShrink: 0, borderRadius: "50%", border: "2px solid #4ECCA3", borderTopColor: "transparent", animation: "hll-spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#4ECCA3" }}>업데이트 적용 중…</span>
          <style>{`@keyframes hll-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      );
    }

    // 일반 에러
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
            이 화면을 불러오지 못했어요
          </div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(232,93,117,0.85)", marginBottom: 6, lineHeight: 1.6, paddingLeft: 24 }}>
          작업 내용은 그대로 남아 있어요. 아래 버튼으로 다시 시도하거나, 반복되면 페이지를 새로고침해 주세요.
        </div>
        <div style={{ fontSize: 11, color: "rgba(232,93,117,0.6)", marginBottom: 14, wordBreak: "break-word", lineHeight: 1.6, paddingLeft: 24, fontFamily: "'JetBrains Mono', monospace" }}>
          {this.state.error?.message || "알 수 없는 오류"}
        </div>
        <div style={{ paddingLeft: 24, display: "flex", gap: 8 }}>
          <button onClick={this.reset} aria-label="이 화면 다시 불러오기" style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(232,93,117,0.5)", background: "rgba(232,93,117,0.15)", color: "#E85D75", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}>
            다시 시도
          </button>
          <button onClick={() => window.location.reload()} aria-label="페이지 전체 새로고침" style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(232,93,117,0.3)", background: "transparent", color: "rgba(232,93,117,0.75)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}>
            새로고침
          </button>
        </div>
      </div>
    );
  }
}
