import { Link } from 'react-router'
import { PenBox } from '../atoms/PenBox'

type TopicCardProps = {
  number: number
  label: string
  to: string
}

export function TopicCard({ number, label, to }: TopicCardProps) {
  return (
    <Link to={to} className="block rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
      <PenBox className="grid h-33 w-full content-center justify-items-center gap-0.5 px-5 text-center sm:w-65">
        <span className="font-hand text-lg text-marker">{String(number).padStart(2, '0')}</span>
        <span className="font-hand text-3xl leading-tight">{label}</span>
      </PenBox>
    </Link>
  )
}
