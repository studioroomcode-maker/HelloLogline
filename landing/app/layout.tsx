import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hello Loglines — AI 시나리오 개발 워크스테이션",
  description: "로그라인 한 줄로 시작하는 시나리오 완성. 18개 학술 이론 기반 AI 분석 · 8단계 개발 파이프라인 · 초고까지 자동 생성.",
  keywords: ["로그라인", "시나리오 분석", "AI 시나리오", "영화 기획", "드라마 개발"],
  openGraph: {
    title: "Hello Loglines — AI 시나리오 개발 워크스테이션",
    description: "12개 학술 이론으로 분석하는 AI 시나리오 코치. 로그라인부터 초고까지 8단계 완성.",
    url: "https://hellologlines.com",
    siteName: "Hello Loglines",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Noto Sans KR', sans-serif", background: "#0c0c1c", color: "#f0f0f4" }}>
        {children}
      </body>
    </html>
  );
}
