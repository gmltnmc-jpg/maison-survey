import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maison de Balance · 초진 설문",
  description: "압구정 한방 다이어트·웰니스 의원 초진 설문",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
