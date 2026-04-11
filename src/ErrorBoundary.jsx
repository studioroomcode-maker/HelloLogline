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
            margin: "12px 0",
            padding: "16px 18px",
            borderRadius: 10,
            background: "rgba(232,93,117,0.06)",
            border: "1px solid rgba(232,93,117,0.22)",
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 700, color: "#E85D75", marginBottom: 4 }}
          >
            패널 렌더링 오류
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(232,93,117,0.65)",
              marginBottom: 12,
              wordBreak: "break-word",
            }}
          >
            {this.state.error?.message || "알 수 없는 오류가 발생했습니다."}
          </div>
          <button
            onClick={this.reset}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid rgba(232,93,117,0.3)",
              background: "rgba(232,93,117,0.1)",
              color: "#E85D75",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
