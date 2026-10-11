import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "조은 디자인 | 생활을 담은 공간", template: "%s | 조은 디자인" },
  description: "생활 동선과 취향을 함께 살피는 주거 인테리어 스튜디오 조은 디자인입니다.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
