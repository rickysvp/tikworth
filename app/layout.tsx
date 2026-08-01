import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tikworth.com'),
  title: "TikWorth - TikTok 账号商业价值评估",
  description: "输入一个 TikTok 账号，10 秒内输出「这个号值不值得投/合作」的专业结论。0-100 评分 + S/A/B/C/D 等级 + 7 维度拆解 + 风险预警。",
  openGraph: {
    title: "TikWorth - TikTok 账号商业价值评估",
    description: "输入一个 TikTok 账号，10 秒内输出「这个号值不值得投/合作」的专业结论。",
    type: 'website',
    locale: 'zh_CN',
    siteName: 'TikWorth',
  },
  twitter: {
    card: 'summary_large_image',
    title: "TikWorth - TikTok 账号商业价值评估",
    description: "输入一个 TikTok 账号，10 秒内输出「这个号值不值得投/合作」的专业结论。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-neutral-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
