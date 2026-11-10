import { Fragment } from 'react'
import { Link } from 'react-router'
import { TopicSwitcher } from '../molecules/TopicSwitcher'

type Crumb = {
  label: string
  to: string
}

type BreadcrumbProps = {
  trail: Crumb[]
  current: string
  siblings?: Crumb[]
  currentIndex?: number
}

export function Breadcrumb({ trail, current, siblings = [], currentIndex = 0 }: BreadcrumbProps) {
  return (
    <nav className="relative flex flex-wrap items-center gap-2 text-sm font-medium">
      {trail.map((crumb) => (
        <Fragment key={crumb.to}>
          <Link to={crumb.to} className="text-muted transition-colors hover:text-ink">
            {crumb.label}
          </Link>
          <span className="text-faint">/</span>
        </Fragment>
      ))}
      {siblings.length > 1 ? (
        <TopicSwitcher label={current} items={siblings} currentIndex={currentIndex} />
      ) : (
        <span aria-current="page">{current}</span>
      )}
    </nav>
  )
}
