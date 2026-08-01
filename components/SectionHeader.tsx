interface SectionHeaderProps {
  step: string
  title: string
  icon: React.ReactNode
}

export function SectionHeader({ step, title, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-neutral-700 bg-neutral-800 text-[10px] font-bold text-neutral-400 tabular-nums">
        {step}
      </span>
      <span className="text-neutral-500">{icon}</span>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{title}</h3>
      <div className="flex-1 h-px bg-neutral-800 ml-3" />
    </div>
  )
}
