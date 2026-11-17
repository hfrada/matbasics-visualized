import { Fragment, type ReactNode } from 'react'

export type LabelledRow = { key: string; label: ReactNode; content: ReactNode }

export function LabelledRows({ lines }: { lines: LabelledRow[] }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-3">
      {lines.map((line) => (
        <Fragment key={line.key}>
          <span className="font-hand text-[21px] leading-none text-muted">{line.label}</span>
          <span data-line={line.key} className="min-w-0 overflow-x-auto overflow-y-hidden">
            {line.content}
          </span>
        </Fragment>
      ))}
    </div>
  )
}
