import type { ReactNode } from 'react'
import type { BoundedSet } from '../../lib/bounds'
import { crowdedLabels, linePosition } from '../../lib/numberLineLayout'
import { SvgMathName } from '../atoms/SvgMathName'
import { SvgNumberLine } from '../atoms/SvgNumberLine'

export type BoundsLineView = { lo: number; hi: number; unit: number; labelStep: number }
export type BoundsProbe = { name: string; value: number; label: string; raised: boolean }
export type BoundsWitness = { side: 'above' | 'below'; value: number; label: string }
export type BoundsRow = {
  kind: 'upper' | 'lower'
  title: string
  noneText: string
  value: number | null
  best: { label: ReactNode; member: boolean } | null
}

type BoundsLineBoardProps = {
  set: BoundedSet
  view: BoundsLineView
  setName: string
  probes: BoundsProbe[]
  witnesses: BoundsWitness[]
  rows: BoundsRow[]
  litLabels: number[]
  ariaLabel: string
}

const width = 650
const left = 128
const right = 600
const axisY = 74
const rowYs = [axisY + 104, axisY + 144]
const witnessLabelYs = { above: axisY + 52, below: axisY + 72 }
const sequenceTerms = 200
const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high)

function SetMarks({ set, px, view }: { set: BoundedSet; px: (value: number) => number; view: BoundsLineView }) {
  if (set.kind === 'sequence') {
    const terms = Array.from({ length: sequenceTerms }, (_, index) => ({ n: index + 1, value: set.term(index + 1) }))
    return (
      <g data-set="sequence">
        {terms
          .filter(({ value }) => value >= view.lo && value <= view.hi)
          .map(({ n, value }) => (
            <circle key={n} data-member={n} cx={px(value)} cy={axisY} r={n > 6 ? 2.6 : 4.6} className={`fill-ink ${n > 6 ? 'opacity-45' : ''}`} />
          ))}
      </g>
    )
  }
  const from = set.lo === -Infinity ? left - 14 : px(set.lo)
  const to = set.hi === Infinity ? right + 14 : px(set.hi)
  const end = (at: number, closed: boolean) => (
    <circle cx={px(at)} cy={axisY} r={5.5} strokeWidth={2.2} className={closed ? 'fill-ink stroke-ink' : 'fill-paper stroke-ink'} data-end={closed ? 'closed' : 'open'} />
  )
  return (
    <g data-set="interval">
      <rect x={from} y={axisY - 9} width={to - from} height={18} className="fill-highlight" />
      <line x1={from} x2={to} y1={axisY} y2={axisY} strokeWidth={4} className="stroke-ink" />
      {Number.isFinite(set.lo) && end(set.lo, set.loClosed)}
      {Number.isFinite(set.hi) && end(set.hi, set.hiClosed)}
    </g>
  )
}

function RowMarks({ row, y, px }: { row: BoundsRow; y: number; px: (value: number) => number }) {
  const title = (
    <text x={8} y={y + 6} className="fill-muted font-hand text-[21px] font-medium">
      {row.title}
    </text>
  )
  const guide = <line x1={left - 14} x2={right + 14} y1={y} y2={y} strokeWidth={1.2} className="stroke-faint" />
  if (row.value === null) {
    return (
      <g data-bounds={row.kind} data-value="none">
        {title}
        {guide}
        <text x={(left + right) / 2} y={y - 8} textAnchor="middle" className="fill-muted font-hand text-[20px] font-medium">
          {row.noneText}
        </text>
      </g>
    )
  }
  const at = px(row.value)
  const upper = row.kind === 'upper'
  return (
    <g data-bounds={row.kind} data-value={row.value}>
      {title}
      {guide}
      <line x1={upper ? at : left - 14} x2={upper ? right + 14 : at} y1={y} y2={y} strokeWidth={5} className="stroke-ink opacity-55" />
      <path d={upper ? `M${right + 22} ${y} l-10 -6 v12 z` : `M${left - 22} ${y} l10 -6 v12 z`} className="fill-ink opacity-55" />
      <line x1={at} x2={at} y1={y - 8} y2={y + 8} strokeWidth={1.4} strokeDasharray="3 3" className="stroke-ink" />
      {row.best && (
        <g data-best={row.kind} data-member={row.best.member}>
          <circle cx={at} cy={y} r={7} strokeWidth={2.6} className={row.best.member ? 'fill-marker stroke-marker' : 'fill-paper stroke-marker'} />
          <text x={upper ? at - 12 : at + 12} y={y - 10} textAnchor={upper ? 'end' : 'start'} className="fill-marker font-math text-[16px]">
            {row.best.label}
          </text>
        </g>
      )}
    </g>
  )
}

export function BoundsLineBoard({ set, view, setName, probes, witnesses, rows, litLabels, ariaLabel }: BoundsLineBoardProps) {
  const px = linePosition(view.lo, view.hi, left, right)
  return (
    <svg viewBox={`0 0 ${width} ${axisY + 168}`} role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
      <text x={8} y={axisY + 6} className="fill-ink font-math text-[19px]">
        <SvgMathName name={setName} />
      </text>
      <SvgNumberLine
        y={axisY}
        lo={view.lo}
        hi={view.hi}
        px={px}
        tickSide="below"
        hiddenLabels={crowdedLabels(litLabels, view.lo, view.hi, view.labelStep, px, view.unit)}
        labelStep={view.labelStep}
        unit={view.unit}
        litLabels={litLabels}
      />
      {rows.map((row, index) => (
        <RowMarks key={row.kind} row={row} y={rowYs[index]} px={px} />
      ))}
      <SetMarks set={set} px={px} view={view} />
      {probes.map((probe) => {
        const at = px(probe.value)
        const labelY = probe.raised ? axisY - 54 : axisY - 34
        return (
          <g key={probe.name} data-probe={probe.name} data-value={probe.value}>
            <line x1={at} x2={at} y1={labelY + 5} y2={axisY - 26} strokeWidth={1.4} strokeDasharray="3 3" className="stroke-ink" />
            <line x1={at} x2={at} y1={axisY - 12} y2={axisY} strokeWidth={1.4} strokeDasharray="3 3" className="stroke-ink" />
            <path d={`M${at - 7} ${axisY - 26} h14 l-7 12 z`} className="fill-ink" />
            <text x={clamp(at, 40, width - 40)} y={labelY} textAnchor="middle" className="fill-ink font-math text-[16px]">
              <SvgMathName name={probe.label} />
            </text>
          </g>
        )
      })}
      {witnesses.map((witness) => {
        const at = px(witness.value)
        const labelY = witnessLabelYs[witness.side]
        return (
          <g key={witness.side} data-witness={witness.side} data-value={witness.value}>
            <circle cx={at} cy={axisY} r={5} className="fill-marker" />
            <line x1={at} x2={at} y1={axisY + 6} y2={labelY - 14} strokeWidth={1.4} strokeDasharray="3 3" className="stroke-marker" />
            <text x={clamp(at, 50, width - 50)} y={labelY} textAnchor="middle" className="fill-marker font-math text-[16px]">
              <SvgMathName name={witness.label} />
            </text>
          </g>
        )
      })}
    </svg>
  )
}
