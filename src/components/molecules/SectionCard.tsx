import { Link } from 'react-router'
import { PenBox } from '../atoms/PenBox'

type SectionCardProps = {
  label: string
  to?: string
}

const boxClasses = 'grid h-28 w-full place-items-center px-4 sm:w-48'

export function SectionCard({ label, to }: SectionCardProps) {
  const content = <span className="text-center font-hand text-3xl leading-tight">{label}</span>

  if (!to) {
    return (
      <PenBox interactive={false} className={`cursor-not-allowed opacity-60 ${boxClasses}`}>
        {content}
      </PenBox>
    )
  }

  return (
    <Link to={to} className="block rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
      <PenBox className={boxClasses}>{content}</PenBox>
    </Link>
  )
}
