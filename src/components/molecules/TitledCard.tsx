import type { ReactNode } from 'react'

type TitledCardProps = {
  title: ReactNode
  wide?: boolean
  children: ReactNode
}

export function TitledCard({ title, wide = false, children }: TitledCardProps) {
  return (
    <div className={`pen-border relative min-w-0 bg-paper px-5.5 py-4.5 leading-[1.65] ${wide ? 'sm:col-span-2' : ''}`}>
      <h2 className="mb-4.5 font-hand text-[26px] leading-tight font-bold">{title}</h2>
      {children}
    </div>
  )
}
