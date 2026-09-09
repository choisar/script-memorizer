import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "대본 암기 훈련 웹앱 (Script Memorizer)",
  description: "대본 업로드, 블라인드 암기 테스트, 음성 STT 및 정밀 텍스트 Diff 시각화 피드백",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
