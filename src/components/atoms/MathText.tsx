import { Fragment } from 'react'
import { MathTex } from './MathTex'

type MathTextProps = {
  text: string
}

export function MathText({ text }: MathTextProps) {
  return (
    <>
      {text.split('$').map((part, index) =>
        index % 2 === 1 ? (
          <MathTex key={index} tex={part} className="text-[0.8em]" />
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  )
}
