import type { ComponentProps } from 'react'

export function PenButton({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={`pen-outline flex cursor-pointer items-center gap-2 bg-paper px-4 py-2 text-sm font-medium text-ink transition duration-150 hover:bg-highlight-soft disabled:pointer-events-none disabled:opacity-40 ${className}`}
      {...props}
    />
  )
}
