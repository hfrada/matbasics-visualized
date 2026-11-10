import type { ReactNode } from 'react'

const sizeClasses = {
  lg: 'text-5xl sm:text-6xl',
  md: 'text-4xl sm:text-5xl',
}

type TitleProps = {
  size?: keyof typeof sizeClasses
  children: ReactNode
}

export function Title({ size = 'lg', children }: TitleProps) {
  return <h1 className={`font-hand font-bold ${sizeClasses[size]}`}>{children}</h1>
}
