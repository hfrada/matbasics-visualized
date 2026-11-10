import katex from 'katex'
import { useMemo } from 'react'

type MathTexProps = {
  tex: string
  className?: string
}

export function MathTex({ tex, className = '' }: MathTexProps) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false }), [tex])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
