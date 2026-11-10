import type { ReactNode } from 'react'

type DeckTemplateProps = {
  breadcrumb: ReactNode
  toolbar: ReactNode
  title: ReactNode
  controls: ReactNode
  content: ReactNode
  closing: ReactNode
  pager: ReactNode
}

export function DeckTemplate({ breadcrumb, toolbar, title, controls, content, closing, pager }: DeckTemplateProps) {
  return (
    <div className="flex min-h-svh flex-col px-4 py-6 sm:pr-8 sm:pl-20">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {breadcrumb}
        <div className="ml-auto">{toolbar}</div>
      </header>
      <main className="mx-auto w-full max-w-5xl pt-6 pb-16">
        <div className="enter">{title}</div>
        <div className="enter mt-5 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ animationDelay: '60ms' }}>
          {controls}
        </div>
        <div className="enter mt-9" style={{ animationDelay: '120ms' }}>
          {content}
        </div>
        <div className="enter mx-auto mt-13 max-w-160 text-center" style={{ animationDelay: '180ms' }}>
          {closing}
        </div>
        {pager}
      </main>
    </div>
  )
}
