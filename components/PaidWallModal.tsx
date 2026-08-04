'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { PaidWall } from '@/components/PaidWall'
import type { Evaluation } from '@/types'
import type { CreditBalance } from '@/lib/credits'

interface Props {
  open: boolean
  onClose: () => void
  onUnlock: () => void
  result?: Evaluation | null
  existingBalance?: CreditBalance | null
  isUnlocking?: boolean
  balanceLoading?: boolean
  /** 预选账号名（用于弹窗内提示） */
  username?: string
  /** 'evaluate' = new account evaluation, 'unlock' = unlock previously saved evaluation */
  mode?: 'evaluate' | 'unlock'
}

export function PaidWallModal({ open, onClose, onUnlock, result, existingBalance, isUnlocking, balanceLoading, username, mode = 'evaluate' }: Props) {
  // ESC 关闭 + 锁定滚动
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isUnlocking) onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, isUnlocking, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget && !isUnlocking) onClose() }}
    >
      <div className="relative w-full max-w-2xl my-4 sm:my-8 max-h-[90vh] flex flex-col">
        {/* 关闭按钮 */}
        <button
          onClick={() => { if (!isUnlocking) onClose() }}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-[#1a1a1a] border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 账号提示（可选） */}
        {username && (
          <div className="rounded-t-2xl border-x border-t border-[#00F2EA]/30 bg-[#00F2EA]/5 px-5 py-3 text-center flex-shrink-0">
            <p className="text-sm text-neutral-300">
              {mode === 'unlock'
                ? <>View <span className="text-[#00F2EA] font-semibold">@{username}</span>&apos;s saved evaluation</>
                : <>Unlock <span className="text-[#00F2EA] font-semibold">@{username}</span>&apos;s full evaluation</>
              }
            </p>
          </div>
        )}

        {/* PaidWall 主体 */}
        <div className={username ? 'rounded-b-2xl border-x border-b border-neutral-800 bg-[#0f0f0f] flex-1 min-h-0' : 'rounded-2xl border border-neutral-800 bg-[#0f0f0f] flex-1 min-h-0'}>
          <PaidWall
            onUnlock={onUnlock}
            result={result}
            existingBalance={existingBalance}
            isUnlocking={isUnlocking}
            balanceLoading={balanceLoading}
            mode={mode}
          />
        </div>
      </div>
    </div>
  )
}
