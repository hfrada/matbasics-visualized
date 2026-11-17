type SvgBraceProps = {
  from: number
  to: number
  y: number
  label: string
  now: boolean
}

export function SvgBrace({ from, to, y, label, now }: SvgBraceProps) {
  const left = from + 2
  const right = to - 2
  const middle = (from + to) / 2
  const path = `M${left} ${y} q0 -6 6 -6 H${middle - 6} q6 0 6 -6 q0 6 6 6 H${right - 6} q6 0 6 6`
  return (
    <g data-brace={now ? 'now' : 'idle'}>
      <path d={path} strokeWidth={now ? 2 : 1.5} className={`fill-none ${now ? 'stroke-marker' : 'stroke-muted'}`} />
      <text
        x={middle}
        y={y - 18}
        textAnchor="middle"
        className={`font-math text-base ${now ? 'fill-marker' : 'fill-muted'}`}
      >
        {label}
      </text>
    </g>
  )
}
