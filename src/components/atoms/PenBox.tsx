import type { ComponentProps } from 'react'

type PenBoxProps = ComponentProps<'div'> & {
  interactive?: boolean
}

export function PenBox({ interactive = true, className = '', ...props }: PenBoxProps) {
  const hover = interactive ? 'hover:-translate-y-0.5 hover:bg-highlight-soft' : ''

  return <div className={`pen-border relative bg-paper transition duration-150 ${hover} ${className}`} {...props} />
}
