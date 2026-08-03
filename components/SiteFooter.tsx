import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'
import { getServerDict } from '@/lib/i18n/server'

const dict = getServerDict()

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-[#0a0a0a]">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/tokvalue.png" alt="TokValue" width={140} height={36} className="h-9 w-auto object-contain" />
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed mb-4">
              {dict.home.footer.tagline}
            </p>
            <a
              href="mailto:connect@tokvalue.com"
              className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-[#00F2EA] transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              connect@tokvalue.com
            </a>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">{dict.home.footer.product}</h4>
            <ul className="space-y-3">
              <li><Link href="/#capabilities" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.home.footer.capabilities}</Link></li>
              <li><Link href="/#pricing" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.nav.pricing}</Link></li>
              <li><Link href="/blog" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.home.footer.blog}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">{dict.home.footer.legal}</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.home.footer.privacyPolicy}</Link></li>
              <li><Link href="/terms" className="text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.home.footer.termsOfService}</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-5xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} TokValue. All rights reserved.
          </p>
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap justify-center">
            <span className="text-xs text-neutral-600">No auto-renewal</span>
            <span className="text-neutral-800">·</span>
            <span className="text-xs text-neutral-600">Cross-device access</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
