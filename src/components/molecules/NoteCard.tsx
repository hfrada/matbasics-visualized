import type { ReactNode } from 'react'

type NoteCardProps = {
  title?: ReactNode
  children: ReactNode
}

export function NoteCard({ title, children }: NoteCardProps) {
  return (
    <div className="pen-border relative min-h-36 px-5 py-4 font-hand text-2xl leading-snug">
      {title && <h2 className="mb-1.5 font-hand text-3xl font-bold">{title}</h2>}
      {children}
    </div>
  )
}
