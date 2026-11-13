import { MathTex } from '../atoms/MathTex'

export type TableCellStatus = 'inside' | 'outside' | 'undefined' | 'hidden'

export type TableCell = {
  label: string
  resultTex: string | null
  status: TableCellStatus
}

export type TablePosition = {
  row: number
  column: number
}

type OperationTableBoardProps = {
  cornerTex: string
  headerTex: string[]
  cells: TableCell[][]
  active: TablePosition | null
  interactive: boolean
  onSelect: (position: TablePosition) => void
}

export const outsideRingClass =
  'pointer-events-none absolute inset-x-[6%] inset-y-[14%] rounded-[50%] border-2 border-marker'

export const hatchClass =
  'bg-[repeating-linear-gradient(45deg,transparent_0_6px,var(--color-faint)_6px_7.2px)]'

export function OperationTableBoard({
  cornerTex,
  headerTex,
  cells,
  active,
  interactive,
  onSelect,
}: OperationTableBoardProps) {
  const size = headerTex.length + 1

  function edges(row: number, column: number) {
    const bottom = row === 0 ? 'border-b-2 border-b-ink' : row < size - 1 ? 'border-b border-b-faint' : ''
    const right = column === 0 ? 'border-r-2 border-r-ink' : column < size - 1 ? 'border-r border-r-faint' : ''
    return `${bottom} ${right}`
  }

  const base = 'relative flex aspect-square items-center justify-center text-[18px]'
  const glow = 'bg-highlight dark:text-paper'

  return (
    <div
      className="mx-auto grid w-fit max-w-full border-2 border-ink bg-paper"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 74px))` }}
    >
      <div className={`${base} ${edges(0, 0)} text-muted`}>
        <MathTex tex={cornerTex} className="text-[0.95em]" />
      </div>
      {headerTex.map((tex, column) => (
        <div
          key={`column-${tex}`}
          className={`${base} ${edges(0, column + 1)} font-semibold ${active?.column === column ? glow : ''}`}
        >
          <MathTex tex={tex} />
        </div>
      ))}
      {cells.map((row, rowIndex) => [
        <div
          key={`row-${headerTex[rowIndex]}`}
          className={`${base} ${edges(rowIndex + 1, 0)} font-semibold ${active?.row === rowIndex ? glow : ''}`}
        >
          <MathTex tex={headerTex[rowIndex]} />
        </div>,
        ...row.map((cell, column) => {
          const isActive = active?.row === rowIndex && active.column === column
          return (
            <button
              key={`${rowIndex}-${column}`}
              type="button"
              aria-label={cell.label}
              data-status={cell.status}
              disabled={!interactive}
              onClick={() => onSelect({ row: rowIndex, column })}
              className={`${base} ${edges(rowIndex + 1, column + 1)} ${interactive ? 'cursor-pointer hover:bg-highlight-soft' : ''} ${cell.status === 'undefined' ? hatchClass : ''} ${isActive ? 'shadow-[inset_0_0_0_3px_var(--color-ink)]' : ''}`}
            >
              {cell.status === 'inside' && cell.resultTex !== null && (
                <MathTex tex={cell.resultTex} className="marker-highlight dark:text-paper" />
              )}
              {cell.status === 'outside' && cell.resultTex !== null && (
                <>
                  <MathTex tex={cell.resultTex} className="text-marker" />
                  <span aria-hidden="true" className={outsideRingClass} />
                </>
              )}
            </button>
          )
        }),
      ])}
    </div>
  )
}
