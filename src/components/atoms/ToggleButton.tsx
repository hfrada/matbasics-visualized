import type { ComponentProps } from 'react'

type ToggleButtonProps = ComponentProps<'button'> & {
  active: boolean
}

export function ToggleButton({ active, className = '', ...props }: ToggleButtonProps) {
  const state = active
    ? 'text-ink underline decoration-2 underline-offset-4'
    : 'text-faint hover:text-ink'

  return (
    <button
      type="button"
      aria-pressed={active}
      className={`cursor-pointer px-1 text-sm font-medium transition-colors ${state} ${className}`}
      {...props}
    />
  )
}
