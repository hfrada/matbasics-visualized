import { MathTex } from '../atoms/MathTex'

export type TruthRow = {
  values: boolean[]
  result: boolean
  filled: boolean
  deciders: number[]
  meaning: string
  who: string
}

type TruthTableBoardProps = {
  inputsTex: string[]
  resultTex: string
  rowHead: string
  meaningHead: string
  rows: TruthRow[]
  active: number | null
  picked: number | null
  interactive: boolean
  truthLabel: (value: boolean) => string
  rowLabel: (row: number) => string
  onPick: (row: number) => void
}

export const deciderRingClass =
  'pointer-events-none absolute inset-x-1.5 inset-y-1 rounded-full border-2 border-marker'
export const truthValueClass = 'relative inline-block min-w-11.5 px-2 py-3.5 font-hand text-[26px] leading-none font-bold'

function resultStatus(row: TruthRow) {
  if (!row.filled) return 'pending'
  return row.result ? 'true' : 'false'
}

const resultTone = {
  pending: 'opacity-20',
  true: 'bg-highlight dark:text-paper',
  false: 'text-marker',
}

export function TruthTableBoard({
  inputsTex,
  resultTex,
  rowHead,
  meaningHead,
  rows,
  active,
  picked,
  interactive,
  truthLabel,
  rowLabel,
  onPick,
}: TruthTableBoardProps) {
  const columns = `2.75rem repeat(${inputsTex.length}, 3.75rem) 4.75rem minmax(0, max-content)`

  return (
    <div className="grid w-fit max-w-full" style={{ gridTemplateColumns: columns }}>
      <div className="col-span-full grid grid-cols-subgrid items-end border-b-[1.5px] border-ink">
        <span className="py-2.5 text-center font-hand text-[19px] leading-none text-muted">{rowHead}</span>
        {inputsTex.map((tex) => (
          <span key={tex} className="py-2.5 text-center">
            <MathTex tex={tex} />
          </span>
        ))}
        <span className="border-l-[1.5px] border-ink py-2.5 text-center whitespace-nowrap">
          <MathTex tex={resultTex} />
        </span>
        <span className="py-2.5 pr-3 pl-5 font-hand text-[21px] leading-none font-bold">{meaningHead}</span>
      </div>
      {rows.map((row, index) => {
        const status = resultStatus(row)
        const tone = active === index ? 'bg-highlight-soft' : interactive ? 'hover:bg-highlight-soft' : ''
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
              <span data-result={status} className={`${truthValueClass} transition-opacity duration-300 ${resultTone[status]}`}>
                {row.filled ? truthLabel(row.result) : '?'}
              </span>
            </span>
            <span
              className={`pr-3 pl-5 text-left text-[15px] transition-opacity duration-300 ${row.filled ? '' : 'opacity-20'}`}
            >
              {row.meaning}
              {row.who && <span className="text-muted"> ({row.who})</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
