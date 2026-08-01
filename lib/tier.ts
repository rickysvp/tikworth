export const TIER_COLORS: Record<string, string> = {
  S: '#00F2EA',
  A: '#00F2EA',
  B: '#22c55e',
  C: '#f59e0b',
  D: '#f97316',
  E: '#ef4444',
  F: '#dc2626',
}

export const TIER_LABELS: Record<string, string> = {
  S: '顶级账号 · 值得高价合作',
  A: '优质账号 · 推荐合作',
  B: '合格账号 · 可谈价合作',
  C: '一般账号 · 有提升空间',
  D: '问题账号 · 暂不建议合作',
  E: '高风险账号 · 真实度存疑',
  F: '不建议合作 · 质量严重不足',
}

export function tierColor(tier: string): string {
  return TIER_COLORS[tier] || '#FF0050'
}
