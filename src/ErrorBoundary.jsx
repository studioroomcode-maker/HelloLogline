import { Component } from "react";
import { Sentry } from "./sentry.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
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
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            margin: "16px 0",
            padding: "20px 22px",
            borderRadius: 12,
            background: "rgba(232,93,117,0.12)",
            border: "1.5px solid rgba(232,93,117,0.45)",
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E85D75" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#E85D75" }}>
              이 단계를 불러오는 중 오류가 발생했습니다
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(232,93,117,0.85)",
              marginBottom: 14,
              wordBreak: "break-word",
              lineHeight: 1.6,
              paddingLeft: 24,
            }}
          >
            {this.state.error?.message || "알 수 없는 오류가 발생했습니다."}
          </div>
          <div style={{ paddingLeft: 24 }}>
            <button
              onClick={this.reset}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: "1px solid rgba(232,93,117,0.5)",
                background: "rgba(232,93,117,0.15)",
                color: "#E85D75",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
