import { isMultipleOf, lineTicks } from '../../lib/numberLineLayout'

export type PlotView = { lo: number; hi: number; unit: number; labelStep: number }
export type PlotTerm = { n: number; value: number; label: string; shown: boolean }
export type PlotLine = { side: 'upper' | 'lower'; name: string; value: number }
export type PlotWitness = { side: 'upper' | 'lower'; n: number; value: number; label: string }
export type PlotZone = { side: 'upper' | 'lower'; value: number | null; noneText: string }
export type PlotRelation = { n: number; symbol: string; now: boolean }
export type PlotLit = { value: number; label: string }

type SequencePlotBoardProps = {
  view: PlotView
  terms: PlotTerm[]
  finite: boolean
  valueLabels: boolean
  chosen: number | null
  path: boolean
  pair: number | null
  relations: PlotRelation[]
  relationTitle: string
  lines: PlotLine[]
  witnesses: PlotWitness[]
  zones: PlotZone[]
  litValues: PlotLit[]
  axisLabel: (value: number) => string
  ariaLabel: string
}

const width = 680
const axisX = 92
const firstColumn = 150
const gap = 50
const top = 34
const bottom = 290
const lastColumn = firstColumn + 9 * gap
const lineEnd = lastColumn + 12
const indexY = bottom + 12
const relationY = bottom + 58
const labelGap = 18
const textWidth = (text: string) => text.length * 7.6 + 2
const rounded = (value: number) => Math.round(value * 1e6) / 1e6

function Subscripted({ n, label }: { n: number; label: string }) {
  return (
    <>
      <tspan className="font-math-italic italic">a</tspan>
      <tspan dy={4} className="text-[12px]">
        {n}
      </tspan>
      <tspan dy={-4}> = {label}</tspan>
    </>
  )
}

function lineLabelYs(upper: number | null, lower: number | null) {
  if (upper === null || lower === null) {
    return { upper: upper === null ? null : upper - 4, lower: lower === null ? null : lower + 16 }
  }
  const lowerOnTop = lower < upper
  const higher = Math.min(upper, lower)
  const deeper = Math.max(upper, lower)
  let above = higher - 4
  let below = deeper + 16
  if (below > bottom + 2) {
    below = deeper - 4
    above = Math.min(above, below - 20)
  }
  return lowerOnTop ? { upper: below, lower: above } : { upper: above, lower: below }
}

export function SequencePlotBoard({
  view,
  terms,
  finite,
  valueLabels,
  chosen,
  path,
  pair,
  relations,
  relationTitle,
  lines,
  witnesses,
  zones,
  litValues,
  axisLabel,
  ariaLabel,
}: SequencePlotBoardProps) {
  const first = terms[0].n
  const last = terms[terms.length - 1].n
  const columnX = (n: number) => firstColumn + (n - first) * gap
  const py = (value: number) => bottom - ((value - view.lo) * (bottom - top)) / (view.hi - view.lo)
  const termOf = (n: number) => terms.find((term) => term.n === n)
  const ticks = lineTicks(view.lo, view.hi, view.unit).map(rounded)
  const labels: (PlotLit & { lit: boolean })[] = []
  for (const item of litValues) if (!labels.some((label) => Math.abs(label.value - item.value) < 1e-9)) labels.push({ ...item, lit: true })
  for (const tick of ticks) {
    if (!isMultipleOf(tick, view.labelStep)) continue
    if (labels.some((label) => Math.abs(py(label.value) - py(tick)) < labelGap)) continue
    labels.push({ value: tick, label: axisLabel(tick), lit: false })
  }
  const chosenTerm = chosen === null ? undefined : termOf(chosen)
  const pairTerms = pair === null ? [] : [termOf(pair), termOf(pair + 1)]
  const upperLine = lines.find((line) => line.side === 'upper')
  const lowerLine = lines.find((line) => line.side === 'lower')
  const lineYs = lineLabelYs(upperLine ? py(upperLine.value) : null, lowerLine ? py(lowerLine.value) : null)
  const indexEnd = finite ? lastColumn + 18 : lastColumn + 44

  return (
    <svg viewBox={`0 0 ${width} ${bottom + 70}`} role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      {zones.map((zone) => {
        if (zone.value === null) {
          return (
            <text
              key={zone.side}
              data-zone={zone.side}
              data-value="none"
              x={firstColumn - 6}
              y={zone.side === 'upper' ? top + 8 : bottom - 8}
              className="fill-muted font-hand text-[20px] font-medium"
            >
              {zone.noneText}
            </text>
          )
        }
        const y = py(zone.value)
        const from = zone.side === 'upper' ? top - 8 : y
        const to = zone.side === 'upper' ? y : bottom + 4
        return (
          <g key={zone.side} data-zone={zone.side} data-value={zone.value}>
            <rect x={axisX} y={from} width={lineEnd - axisX} height={to - from} className="fill-highlight opacity-30" />
            <line x1={axisX} x2={lineEnd} y1={y} y2={y} strokeWidth={2.2} className="stroke-ink" />
          </g>
        )
      })}
      {view.lo < 0 && view.hi > 0 && <line x1={axisX} x2={lastColumn + 20} y1={py(0)} y2={py(0)} strokeWidth={1.2} className="stroke-faint" />}
      <g data-axis="value">
        <line x1={axisX} x2={axisX} y1={bottom + 8} y2={top - 8} strokeWidth={1.6} className="stroke-ink" />
        <path d={`M${axisX} ${top - 16} l-5 10 h10 z`} className="fill-ink" />
        <text x={axisX + 12} y={top - 10} className="fill-ink font-math text-[17px]">
          <tspan className="font-math-italic italic">a</tspan>
          <tspan dy={4} className="font-math-italic text-[12px] italic">
            n
          </tspan>
        </text>
        {ticks.map((tick) => (
          <line key={tick} x1={axisX - 5} x2={axisX + 5} y1={py(tick)} y2={py(tick)} strokeWidth={1.3} className="stroke-ink" />
        ))}
        {labels.map((label) => {
          const y = py(label.value)
          return (
            <g key={label.value} data-label={label.value} data-lit={label.lit || undefined}>
              {label.lit && (
                <rect x={axisX - 14 - textWidth(label.label)} y={y - 11} width={textWidth(label.label) + 8} height={21} rx={3} className="fill-highlight" />
              )}
              <text
                x={axisX - 10}
                y={y + 5}
                textAnchor="end"
                className={`font-math text-[14px] ${label.lit ? 'fill-ink font-bold dark:fill-paper' : 'fill-muted'}`}
              >
                {label.label}
              </text>
            </g>
          )
        })}
      </g>
      {path && (
        <polyline
          points={terms.map((term) => `${columnX(term.n)},${py(term.value)}`).join(' ')}
          strokeWidth={1.4}
          className="fill-none stroke-faint"
        />
      )}
      {pairTerms[0] && pairTerms[1] && (
        <line
          data-pair={pair}
          x1={columnX(pairTerms[0].n)}
          x2={columnX(pairTerms[1].n)}
          y1={py(pairTerms[0].value)}
          y2={py(pairTerms[1].value)}
          strokeWidth={3}
          className="stroke-marker"
        />
      )}
      {chosenTerm?.shown && (
        <line
          x1={axisX}
          x2={columnX(chosenTerm.n)}
          y1={py(chosenTerm.value)}
          y2={py(chosenTerm.value)}
          strokeWidth={1.4}
          strokeDasharray="4 3"
          className="stroke-marker"
        />
      )}
      {terms
        .filter((term) => term.shown)
        .map((term) => {
          const x = columnX(term.n)
          const y = py(term.value)
          const now = term.n === chosen
          return (
            <g key={term.n} data-term={term.n} data-value={term.value}>
              <circle cx={axisX} cy={y} r={3} className="fill-ink opacity-45" />
              <circle cx={x} cy={y} r={5} className="fill-ink" />
              {valueLabels && (
                <text x={x} y={y - 11} textAnchor="middle" className={`font-math text-[14px] ${now ? 'fill-marker font-bold' : 'fill-ink'}`}>
                  {term.label}
                </text>
              )}
            </g>
          )
        })}
      {chosenTerm?.shown && (
        <circle data-chosen={chosenTerm.n} cx={columnX(chosenTerm.n)} cy={py(chosenTerm.value)} r={9} strokeWidth={2.4} className="fill-none stroke-marker" />
      )}
      {relations.length > 0 && (
        <g data-relations>
          <text x={8} y={relationY} className="fill-muted font-hand text-[21px] font-medium">
            {relationTitle}
          </text>
          {relations.map((relation) => {
            const x = columnX(relation.n) + gap / 2
            return (
              <g key={relation.n} data-relation={relation.n} data-now={relation.now || undefined}>
                {relation.now && <rect x={x - 11} y={relationY - 16} width={22} height={22} rx={3} className="fill-highlight" />}
                <text x={x} y={relationY} textAnchor="middle" className={`font-math text-[18px] ${relation.now ? 'fill-ink dark:fill-paper' : 'fill-ink'}`}>
                  {relation.symbol}
                </text>
              </g>
            )
          })}
        </g>
      )}
      {lines.map((line) => (
        <g key={line.side} data-line={line.side} data-value={line.value}>
          <line x1={axisX} x2={lineEnd} y1={py(line.value)} y2={py(line.value)} strokeWidth={1.8} strokeDasharray="7 5" className="stroke-ink" />
          <text x={lastColumn + 14} y={(line.side === 'upper' ? lineYs.upper : lineYs.lower) ?? 0} className="fill-ink font-math-italic text-[18px] italic">
            {line.name}
          </text>
        </g>
      ))}
      {witnesses.map((witness) => {
        const above = witness.side === 'upper'
        if (witness.n > last) {
          const y = Math.min(Math.max(py(witness.value), top), bottom)
          const x = lastColumn + 28
          return (
            <g key={witness.side} data-witness={witness.side} data-n={witness.n} data-value={witness.value} data-outside>
              <path d={`M${x + 10} ${y} l-12 -6 v12 z`} className="fill-marker" />
              <text x={lastColumn} y={above ? y - 10 : y + 22} textAnchor="end" className="fill-marker font-math text-[15px]">
                <Subscripted n={witness.n} label={witness.label} />
              </text>
            </g>
          )
        }
        const x = columnX(witness.n)
        const y = py(witness.value)
        const end = x > 400
        return (
          <g key={witness.side} data-witness={witness.side} data-n={witness.n} data-value={witness.value}>
            <circle cx={x} cy={y} r={9} strokeWidth={2.6} className="fill-none stroke-marker" />
            <text x={end ? x - 12 : x + 12} y={above ? y - 10 : y + 22} textAnchor={end ? 'end' : 'start'} className="fill-marker font-math text-[15px]">
              <Subscripted n={witness.n} label={witness.label} />
            </text>
          </g>
        )
      })}
      <g data-axis="index">
        <line x1={axisX} x2={indexEnd} y1={indexY} y2={indexY} strokeWidth={1.6} className="stroke-ink" />
        {!finite && (
          <>
            <path d={`M${indexEnd + 6} ${indexY} l-10 -5 v10 z`} className="fill-ink" />
            <text x={lastColumn + 40} y={indexY + 21} textAnchor="middle" className="fill-muted font-math text-[18px]">
              …
            </text>
          </>
        )}
        <text x={indexEnd + 14} y={indexY + 6} className="fill-ink font-math-italic text-[17px] italic">
          n
        </text>
        {terms.map((term) => {
          const x = columnX(term.n)
          const lit = term.n === chosen && term.shown
          const labelWidth = textWidth(String(term.n))
          return (
            <g key={term.n} data-index={term.n} data-lit={lit || undefined}>
              <line x1={x} x2={x} y1={indexY - 4} y2={indexY + 4} strokeWidth={1.3} className="stroke-ink" />
              {lit && <rect x={x - labelWidth / 2 - 4} y={indexY + 6} width={labelWidth + 8} height={20} rx={3} className="fill-highlight" />}
              <text
                x={x}
                y={indexY + 21}
                textAnchor="middle"
                className={`font-math text-[14px] ${lit ? 'fill-ink font-bold dark:fill-paper' : 'fill-muted'}`}
              >
                {term.n}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
