import type { ComponentProps } from 'react'

type TabButtonProps = ComponentProps<'button'> & {
  active: boolean
}

export function TabButton({ active, className = '', ...props }: TabButtonProps) {
  const state = active ? 'marker-highlight text-ink dark:text-paper' : 'text-faint hover:text-ink'

  return (
    <button
      type="button"
      aria-pressed={active}
      className={`cursor-pointer px-0.5 font-hand text-2xl transition-colors ${state} ${className}`}
      {...props}
    />
  )
}
