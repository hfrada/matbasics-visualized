import { MathTex } from '../atoms/MathTex'
import { deciderRingClass, truthValueClass } from './TruthTableBoard'

export type LayeredLetter = {
  tex: string
  feeds: boolean
  role?: string
}

export type LayeredColumn = {
  key: string
  tex: string
  lines?: string[]
  role?: string
  step: number | null
  final: boolean
  split: boolean
  filled: boolean
  feeds: boolean
  now: boolean
  highlighted: boolean
}

export type LayeredRow = {
  letters: boolean[]
  cells: boolean[]
  same: boolean
  flagged?: boolean
}

type LayeredTableBoardProps = {
  letters: LayeredLetter[]
  columns: LayeredColumn[]
  groups: { label: string; span: number }[] | null
  rows: LayeredRow[]
  sameHead: string | null
  sameShown: boolean
  comparing: boolean
  rowHead: string
  stepHead: string
  active: number | null
  picked: number | null
  interactive: boolean
  truthLabel: (value: boolean) => string
  rowLabel: (row: number) => string
  onPick: (row: number) => void
  compact?: boolean
}

const splitClass = 'border-l-[1.5px] border-ink'
const feedClass = 'bg-highlight-soft'
const markClass = 'relative inline-block min-w-11.5 px-2 py-3 text-[19px]'

function cellTone(column: LayeredColumn, value: boolean) {
  if (!column.filled) return 'opacity-20'
  if (!column.final) return ''
  return value ? 'bg-highlight dark:text-paper' : 'text-marker'
}

export function LayeredTableBoard({
  letters,
  columns,
  groups,
  rows,
  sameHead,
  sameShown,
  comparing,
  rowHead,
  stepHead,
  active,
  picked,
  interactive,
  truthLabel,
  rowLabel,
  onPick,
  compact = false,
}: LayeredTableBoardProps) {
  const cellWidth = compact ? '2.875rem' : '3.25rem'
  const template = `2.75rem repeat(${letters.length}, ${cellWidth}) repeat(${columns.length}, minmax(${cellWidth}, max-content))${sameHead ? ' 4.5rem' : ''}`
  const hasRoles = letters.some((item) => item.role) || columns.some((column) => column.role)
  const roleClass = 'px-0.5 pb-0.5 text-center font-hand text-[15px] leading-none whitespace-nowrap text-muted'
  const headPadding = compact ? 'px-1' : 'px-2'

  return (
    <div className="grid w-fit max-w-full" style={{ gridTemplateColumns: template }}>
      {hasRoles && (
        <div className="col-span-full grid grid-cols-subgrid items-end">
          <span />
          {letters.map((item) => (
            <span key={item.tex} data-role={item.role} className={roleClass}>
              {item.role}
            </span>
          ))}
          {columns.map((column) => (
            <span
              key={column.key}
              data-role={column.role}
              className={`${roleClass} self-stretch ${column.split ? splitClass : ''}`}
            >
              {column.role}
            </span>
          ))}
          {sameHead && <span />}
        </div>
      )}
      {groups && (
        <div className="col-span-full grid grid-cols-subgrid items-end">
          <span style={{ gridColumn: `span ${letters.length + 1}` }} />
          {groups.map((group) => (
            <span
              key={group.label}
              style={{ gridColumn: `span ${group.span}` }}
              className={`${splitClass} px-2 text-center font-hand text-xl leading-none text-muted`}
            >
              <span className="block border-b border-dashed border-faint pb-2">{group.label}</span>
            </span>
          ))}
          {sameHead && <span />}
        </div>
      )}
      <div className="col-span-full grid grid-cols-subgrid items-end border-b-[1.5px] border-ink">
        <span className="py-2.5 text-center font-hand text-[19px] leading-none text-muted">{rowHead}</span>
        {letters.map((item) => (
          <span key={item.tex} className={`py-2.5 text-center transition-colors duration-300 ${item.feeds ? feedClass : ''}`}>
            <MathTex tex={item.tex} />
          </span>
        ))}
        {columns.map((column) => (
          <span
            key={column.key}
            className={`${headPadding} py-2.5 text-center whitespace-nowrap transition-colors duration-300 ${column.split ? splitClass : ''} ${column.feeds ? feedClass : ''}`}
          >
            {column.lines ? (
              <span className={`inline-block ${column.highlighted ? 'marker-highlight dark:text-paper' : ''}`}>
                {column.lines.map((line) => (
                  <MathTex key={line} tex={line} className="block text-[0.9em] leading-normal" />
                ))}
              </span>
            ) : (
              <MathTex tex={column.tex} className={column.highlighted ? 'marker-highlight dark:text-paper' : ''} />
            )}
          </span>
        ))}
        {sameHead && (
          <span className={`${splitClass} py-2.5 text-center font-hand text-[21px] leading-none font-bold`}>
            <span className={comparing ? 'marker-highlight dark:text-paper' : ''}>{sameHead}</span>
          </span>
        )}
      </div>
      {rows.map((row, index) => {
        const tone =
          active === index
            ? 'bg-highlight-soft'
            : (comparing && !row.same) || row.flagged
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
            {row.letters.map((value, position) => (
              <span
                key={letters[position].tex}
                className={`flex items-center justify-center self-stretch transition-colors duration-300 ${letters[position].feeds ? feedClass : ''}`}
              >
                <span className={truthValueClass}>{truthLabel(value)}</span>
              </span>
            ))}
            {columns.map((column, position) => {
              const value = row.cells[position]
              return (
                <span
                  key={column.key}
                  className={`flex items-center justify-center self-stretch transition-colors duration-300 ${column.split ? splitClass : ''} ${column.feeds ? feedClass : ''}`}
                >
                  <span
                    data-column={position}
                    data-value={column.filled ? String(value) : 'pending'}
                    className={`${truthValueClass} transition-opacity duration-300 ${cellTone(column, value)}`}
                  >
                    {column.filled ? truthLabel(value) : '?'}
                    {row.flagged && column.final && <span aria-hidden="true" className={deciderRingClass} />}
                  </span>
                </span>
              )
            })}
            {sameHead && (
              <span className={`flex items-center justify-center self-stretch ${splitClass}`}>
                <span
                  data-same={sameShown ? String(row.same) : 'pending'}
                  className={`${markClass} transition-opacity duration-300 ${sameShown ? (row.same ? '' : 'text-marker') : 'opacity-20'}`}
                >
                  {sameShown ? <MathTex tex={row.same ? '=' : '\\neq'} /> : '?'}
                  {comparing && !row.same && <span aria-hidden="true" className={deciderRingClass} />}
                </span>
              </span>
            )}
          </button>
        )
      })}
      <div className="col-span-full grid grid-cols-subgrid border-t-[1.5px] border-ink font-hand text-[21px] leading-none">
        <span
          style={{ gridColumn: `span ${letters.length + 1}` }}
          className="pt-2.5 pr-3 text-right font-medium whitespace-nowrap text-muted"
        >
          {stepHead}
        </span>
        {columns.map((column) => (
          <span
            key={column.key}
            data-step-number={column.step === null ? 'none' : column.step + 1}
            className={`pt-2.5 text-center font-bold ${column.split ? splitClass : ''} ${column.now ? 'text-marker' : 'text-muted'}`}
          >
            {column.step === null ? '–' : column.step + 1}
          </span>
        ))}
        {sameHead && <span className={splitClass} />}
      </div>
    </div>
  )
}
