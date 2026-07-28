'use client'

import { BrandPotential } from '@/types'

export function BrandPotentialSection({ potential }: { potential: BrandPotential }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">品牌合作潜力</h3>
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-3xl font-bold tabular-nums">{potential.brandScore}</div>
          <div className="text-xs text-neutral-500 mt-1">品牌合作分</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-2xl font-bold">${potential.estimatedCPM}</div>
          <div className="text-xs text-neutral-500 mt-1">估算 CPM</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-lg font-bold capitalize">{potential.audienceSpendingPower}</div>
          <div className="text-xs text-neutral-500 mt-1">粉丝消费力</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-neutral-300 mb-2">适合合作品类</div>
        <div className="flex flex-wrap gap-2">
          {potential.suitableCategories.map((cat, i) => (
            <span key={i} className="rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/10 px-3 py-1 text-xs text-[#00F2EA]">
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-neutral-300 mb-2">合作类型适配</div>
        <div className="space-y-2">
          {potential.collaborationTypes.map((collab, i) => (
            <div key={i} className="rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{collab.type}</span>
                <span className="text-neutral-400">适配度 {collab.fit}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div className="h-full bg-[#FF0050]" style={{ width: `${collab.fit}%` }} />
              </div>
              <div className="text-xs text-neutral-500 mt-1">{collab.expectedRevenue}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-neutral-300">{potential.brandReasoning}</p>
    </div>
  )
}
