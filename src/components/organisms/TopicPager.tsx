import { Link } from 'react-router'

type PagerLink = {
  label: string
  to: string
}

type TopicPagerProps = {
  previous: PagerLink | null
  next: PagerLink | null
  previousLabel: string
  nextLabel: string
}

const linkClasses = 'pen-outline grid min-w-60 gap-0.5 bg-paper px-4.5 py-3 transition duration-150 hover:bg-highlight-soft sm:max-w-[48%]'

export function TopicPager({ previous, next, previousLabel, nextLabel }: TopicPagerProps) {
  if (!previous && !next) return null

  return (
    <nav className="mt-14 flex flex-col gap-5 sm:flex-row sm:justify-between">
      {previous && (
        <Link to={previous.to} className={linkClasses}>
          <span className="text-[13px] font-medium text-muted">← {previousLabel}</span>
          <span className="font-hand text-2xl leading-tight">{previous.label}</span>
        </Link>
      )}
      {next && (
        <Link to={next.to} className={`${linkClasses} ml-auto text-right`}>
          <span className="text-[13px] font-medium text-muted">{nextLabel} →</span>
          <span className="font-hand text-2xl leading-tight">{next.label}</span>
        </Link>
      )}
    </nav>
  )
}
