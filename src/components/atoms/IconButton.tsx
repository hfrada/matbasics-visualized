import type { ComponentProps } from 'react'

export function IconButton({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={`grid size-8 cursor-pointer place-items-center text-ink transition duration-200 hover:scale-108 ${className}`}
      {...props}
    />
  )
}
