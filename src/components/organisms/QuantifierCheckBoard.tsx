import { MathTex } from '../atoms/MathTex'

export type CheckStatus = 'true' | 'false' | 'unchecked'
export type CheckRing = 'none' | 'solid' | 'dashed'

export type CheckCell = {
  label: string
  valueTex: string
  status: CheckStatus
  ring: CheckRing
  truthLabel: string | null
}

export type CheckLayout =
  | { kind: 'line'; variableTex: string; samplesTex: string[]; rowTex: string; moreLeft: boolean }
  | { kind: 'grid'; cornerTex: string; rowsTex: string[]; columnsTex: string[] }

type QuantifierCheckBoardProps = {
  layout: CheckLayout
  cells: CheckCell[]
  picked: number | null
  interactive: boolean
  onPick: (index: number) => void
}

const statusClasses: Record<CheckStatus, string> = {
  true: 'bg-highlight dark:text-paper',
  false: 'text-marker',
  unchecked: 'opacity-25',
}

type CellButtonProps = {
  cell: CheckCell
  picked: boolean
  interactive: boolean
  onPick: () => void
}

function CellButton({ cell, picked, interactive, onPick }: CellButtonProps) {
  const hover = interactive && cell.status !== 'true' ? 'hover:bg-highlight-soft' : ''
  return (
    <button
      type="button"
      aria-label={cell.label}
      aria-pressed={picked}
      data-status={cell.status}
      onClick={interactive ? onPick : undefined}
      className={`relative block min-h-15 w-full px-1.5 py-3 transition-opacity duration-300 ${statusClasses[cell.status]} ${interactive ? 'cursor-pointer' : 'cursor-default'} ${hover}`}
    >
      <MathTex tex={cell.valueTex} />
      {cell.truthLabel && <span className="mt-2 block font-hand text-lg leading-none font-bold">{cell.truthLabel}</span>}
      {cell.ring !== 'none' && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0.75 inset-y-px rounded-full border-2 border-marker ${cell.ring === 'dashed' ? 'border-dashed' : ''}`}
        />
      )}
    </button>
  )
}

export function QuantifierCheckBoard({ layout, cells, picked, interactive, onPick }: QuantifierCheckBoardProps) {
  const button = (index: number) => (
    <CellButton
      cell={cells[index]}
      picked={picked === index}
      interactive={interactive}
      onPick={() => onPick(index)}
    />
  )

  if (layout.kind === 'line') {
    return (
      <div className="relative overflow-x-auto overflow-y-hidden">
        <table className="my-2 border-separate border-spacing-0">
          <tbody>
            <tr>
              <th className="border-r-[1.5px] border-ink py-3 pr-3 pl-1 text-right font-normal whitespace-nowrap">
                <MathTex tex={layout.variableTex} />
              </th>
              {layout.moreLeft && <td className="px-1 text-muted">…</td>}
              {layout.samplesTex.map((tex, index) => (
                <td key={index} className="min-w-13 px-1.5 py-3 text-center">
                  <MathTex tex={tex} />
                </td>
              ))}
              <td className="px-1 text-muted">…</td>
            </tr>
            <tr>
              <th
                className="border-t-[1.5px] border-r-[1.5px] border-ink py-3 pr-3 pl-1 text-right font-normal whitespace-nowrap"
              >
                <MathTex tex={layout.rowTex} />
              </th>
              {layout.moreLeft && <td className="border-t-[1.5px] border-ink" />}
              {cells.map((_, index) => (
                <td key={index} className="min-w-13 border-t-[1.5px] border-ink p-0 text-center">
                  {button(index)}
                </td>
              ))}
              <td className="border-t-[1.5px] border-ink" />
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  const size = layout.columnsTex.length
  return (
    <div className="relative overflow-x-auto overflow-y-hidden">
      <table className="my-2 border-collapse">
        <thead>
          <tr>
            <th className="border-b-[1.5px] border-ink px-4 py-2.5 font-normal">
              <MathTex tex={layout.cornerTex} />
            </th>
            {layout.columnsTex.map((tex) => (
              <th key={tex} className="border-b-[1.5px] border-ink px-4 py-2.5 font-normal">
                <MathTex tex={tex} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {layout.rowsTex.map((tex, row) => (
            <tr key={tex}>
              <th className="border-r-[1.5px] border-ink px-4 py-2.5 font-normal whitespace-nowrap">
                <MathTex tex={tex} />
              </th>
              {Array.from({ length: size }, (_, column) => {
                const index = row * size + column
                return (
                  <td key={column} className="min-w-19.5 p-1 text-center">
                    {button(index)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
