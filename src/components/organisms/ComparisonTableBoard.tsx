import { MathTex } from '../atoms/MathTex'
import { deciderRingClass, truthValueClass } from './TruthTableBoard'

export type ComparisonRow = {
  values: boolean[]
  given: boolean
  result: boolean
  filled: boolean
  deciders: number[]
}

type ComparisonTableBoardProps = {
  inputsTex: string[]
  givenTex: string
  givenName: string
  resultTex: string
  resultName: string
  sameHead: string
  rowHead: string
  rows: ComparisonRow[]
  active: number | null
  picked: number | null
  interactive: boolean
  comparing: boolean
  truthLabel: (value: boolean) => string
  rowLabel: (row: number) => string
  onPick: (row: number) => void
}

const nameClass = 'mb-1.5 block font-hand text-[19px] leading-none text-muted'
const markClass = 'relative inline-block min-w-11.5 px-2 py-3 text-[19px]'

function resultStatus(row: ComparisonRow) {
  if (!row.filled) return 'pending'
  return row.result ? 'true' : 'false'
}

const resultTone = {
  pending: 'opacity-20',
  true: 'bg-highlight dark:text-paper',
  false: 'text-marker',
}

export function ComparisonTableBoard({
  inputsTex,
  givenTex,
  givenName,
  resultTex,
  resultName,
  sameHead,
  rowHead,
  rows,
  active,
  picked,
  interactive,
  comparing,
  truthLabel,
  rowLabel,
  onPick,
}: ComparisonTableBoardProps) {
  const columns = `2.75rem repeat(${inputsTex.length}, 3.75rem) repeat(2, minmax(4.75rem, max-content)) 4.5rem`

  return (
    <div className="grid w-fit max-w-full" style={{ gridTemplateColumns: columns }}>
      <div className="col-span-full grid grid-cols-subgrid items-end border-b-[1.5px] border-ink">
        <span className="py-2.5 text-center font-hand text-[19px] leading-none text-muted">{rowHead}</span>
        {inputsTex.map((tex) => (
          <span key={tex} className="py-2.5 text-center">
            <MathTex tex={tex} />
          </span>
        ))}
        <span className="border-l-[1.5px] border-ink px-3 py-2.5 text-center whitespace-nowrap">
          <span className={nameClass}>{givenName}</span>
          <MathTex tex={givenTex} />
        </span>
        <span className="px-3 py-2.5 text-center whitespace-nowrap">
          <span className={nameClass}>{resultName}</span>
          <MathTex tex={resultTex} className={comparing ? '' : 'marker-highlight dark:text-paper'} />
        </span>
        <span className="border-l-[1.5px] border-ink py-2.5 text-center font-hand text-[21px] leading-none font-bold">
          <span className={comparing ? 'marker-highlight dark:text-paper' : ''}>{sameHead}</span>
        </span>
      </div>
      {rows.map((row, index) => {
        const status = resultStatus(row)
        const same = row.result === row.given
        const tone =
          active === index
            ? 'bg-highlight-soft'
            : comparing && !same
              ? 'bg-marker/8'
              : interactive
                ? 'hover:bg-highlight-soft'
                : ''
        return (
          <button
            key={index}
            type="button"
            aria-label={rowLabel(index)}
            aria-pressed={picked === index}
            onClick={interactive ? () => onPick(index) : undefined}
            className={`col-span-full grid grid-cols-subgrid items-center text-center transition-colors duration-300 ${index > 0 ? 'border-t border-dashed border-faint' : ''} ${interactive ? 'cursor-pointer' : 'cursor-default'} ${tone}`}
          >
            <span className="font-hand text-[19px] leading-none text-muted">{index + 1}</span>
            {row.values.map((value, column) => {
              const decider = row.deciders.includes(column)
              return (
                <span key={column} className="py-1">
                  <span className={truthValueClass} data-decider={decider || undefined}>
                    {truthLabel(value)}
                    {decider && <span aria-hidden="true" className={deciderRingClass} />}
                  </span>
                </span>
              )
            })}
            <span className="flex items-center justify-center self-stretch border-l-[1.5px] border-ink py-1">
              <span className={`${truthValueClass} opacity-80 ${row.given ? 'bg-highlight dark:text-paper' : 'text-marker'}`}>
                {truthLabel(row.given)}
              </span>
            </span>
            <span className="py-1">
              <span data-result={status} className={`${truthValueClass} transition-opacity duration-300 ${resultTone[status]}`}>
                {row.filled ? truthLabel(row.result) : '?'}
              </span>
            </span>
            <span className="flex items-center justify-center self-stretch border-l-[1.5px] border-ink py-1">
              <span
                data-same={row.filled ? String(same) : 'pending'}
                className={`${markClass} transition-opacity duration-300 ${row.filled ? (same ? '' : 'text-marker') : 'opacity-20'}`}
              >
                {row.filled ? <MathTex tex={same ? '=' : '\\neq'} /> : '?'}
                {comparing && !same && <span aria-hidden="true" className={deciderRingClass} />}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
