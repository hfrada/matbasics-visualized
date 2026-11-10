import type { ReactNode } from 'react'

type HomeTemplateProps = {
  breadcrumb?: ReactNode
  toolbar: ReactNode
  heading: ReactNode
  content: ReactNode
}

export function HomeTemplate({ breadcrumb, toolbar, heading, content }: HomeTemplateProps) {
  return (
    <div className="flex min-h-svh flex-col px-4 py-6 sm:pr-8 sm:pl-20">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {breadcrumb}
        <div className="ml-auto">{toolbar}</div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-14 py-12">
        <div className="enter">{heading}</div>
        {content}
      </main>
    </div>
  )
}
