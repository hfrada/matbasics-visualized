import type { ReactNode } from 'react'

export type StampTone = 'yes' | 'pending' | 'flip'

const tones: Record<StampTone, string> = {
  yes: 'border-ink bg-highlight text-ink dark:text-paper',
  pending: 'border-dashed border-faint text-faint',
  flip: 'border-marker text-marker',
}

export function Stamp({ tone, children }: { tone: StampTone; children: ReactNode }) {
  return (
    <span
      data-stamp={tone}
      className={`inline-block rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 px-3 pt-1 pb-1.5 font-hand text-2xl leading-none font-bold whitespace-nowrap [&_.katex]:text-[0.8em] ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
