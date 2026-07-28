import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import { BarChart3, Clock } from "lucide-react";

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
  title: "TikWorth - TikTok 账号商业价值评估",
  description: "输入一个 TikTok 账号，10 秒内输出「这个号值不值得投/合作」的专业结论。0-100 评分 + S/A/B/C/D 等级 + 7 维度拆解 + 风险预警。",
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
        {/* Top Navbar */}
        <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur-lg">
          <div className="mx-auto max-w-5xl px-4 flex items-center justify-between h-12">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold">
              <span className="gradient-text text-base">TikWorth</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/tracker"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-[#00F2EA] hover:bg-neutral-800/50 transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                账号追踪
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-[#FF0050] hover:bg-neutral-800/50 transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                评估历史
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
