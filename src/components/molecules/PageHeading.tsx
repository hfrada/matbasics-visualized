import type { ReactNode } from 'react'
import { Subtitle } from '../atoms/Subtitle'
import { Title } from '../atoms/Title'

type PageHeadingProps = {
  title: ReactNode
  subtitle: string
}

export function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
    </div>
  )
}
