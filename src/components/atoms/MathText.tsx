import { Fragment } from 'react'
import { MathTex } from './MathTex'

type MathTextProps = {
  text: string
}

const leadingPunctuation = /^[,.;:)!?]+/

export function MathText({ text }: MathTextProps) {
  const parts = text.split('$')

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const math = <MathTex tex={part} className="text-[0.8em]" />
          const trailing = parts[index + 1]?.match(leadingPunctuation)?.[0]
          if (!trailing) return <Fragment key={index}>{math}</Fragment>
          return (
            <span key={index} className="whitespace-nowrap">
              {math}
              {trailing}
            </span>
          )
        }
        const attached = index > 0 ? (part.match(leadingPunctuation)?.[0] ?? '') : ''
        return <Fragment key={index}>{part.slice(attached.length)}</Fragment>
      })}
    </>
  )
}
