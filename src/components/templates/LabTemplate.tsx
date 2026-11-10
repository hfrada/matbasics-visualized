import type { ReactNode } from 'react'

type LabTemplateProps = {
  breadcrumb: ReactNode
  toolbar: ReactNode
  title: ReactNode
  controls: ReactNode
  stage: ReactNode
  detail: ReactNode
  progress: ReactNode
  pager: ReactNode
}

export function LabTemplate({ breadcrumb, toolbar, title, controls, stage, detail, progress, pager }: LabTemplateProps) {
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
        <div
          className="enter mt-6 grid gap-x-8 gap-y-6 md:grid-cols-[minmax(0,1fr)_300px] md:grid-rows-[auto_1fr]"
          style={{ animationDelay: '120ms' }}
        >
          <div className="md:row-span-2">{stage}</div>
          <div className="order-last md:order-none">{detail}</div>
          {progress && <div className="enter">{progress}</div>}
        </div>
        {pager}
      </main>
    </div>
  )
}
