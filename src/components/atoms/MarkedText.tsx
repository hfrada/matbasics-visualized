import { MathText } from './MathText'

type MarkedTextProps = {
  text: string
}

export function MarkedText({ text }: MarkedTextProps) {
  return (
    <>
      {text.split('*').map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="marker-highlight mx-[0.4em] font-semibold dark:text-paper">
            {part}
          </span>
        ) : (
          <MathText key={index} text={part} />
        ),
      )}
    </>
  )
}
