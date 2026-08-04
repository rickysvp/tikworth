import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'
import { getServerDict } from '@/lib/i18n/server'

const dict = getServerDict()

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/tokvalue.png" alt="TokValue" width={140} height={36} className="h-8 w-auto object-contain" />
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed mb-3 max-w-xs">
              {dict.home.footer.tagline}
            </p>
            <a
              href="mailto:connect@tokvalue.com"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-[#00F2EA] transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              connect@tokvalue.com
            </a>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">{dict.home.footer.product}</h4>
            <ul className="space-y-2">
              <li><Link href="/#capabilities" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.home.footer.capabilities}</Link></li>
              <li><Link href="/#pricing" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.nav.pricing}</Link></li>
              <li><Link href="/blog" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.home.footer.blog}</Link></li>
              <li><Link href="/about" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">{dict.home.footer.legal}</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.home.footer.privacyPolicy}</Link></li>
              <li><Link href="/terms" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.home.footer.termsOfService}</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-600">
          <p>© {new Date().getFullYear()} TokValue. All rights reserved.</p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span>TikTok® is a registered trademark of ByteDance Ltd.</span>
            <span className="text-neutral-800">·</span>
            <span>Data sourced from public third-party APIs</span>
          </div>
        </div>
      </div>
    </footer>
  )
}