type SvgResultProps = {
  x: number
  y: number
  value: string
  lit: boolean
  anchor?: 'start' | 'end'
}

export function SvgResult({ x, y, value, lit, anchor = 'start' }: SvgResultProps) {
  const text = `= ${value}`
  const width = 16 + text.length * 11
  return (
    <g data-result={lit ? 'lit' : 'plain'}>
      {lit && (
        <rect
          x={anchor === 'end' ? x - width + 6 : x - 6}
          y={y - 22}
          width={width}
          height={30}
          rx={3}
          className="fill-highlight"
        />
      )}
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        className={`font-hand text-[26px] font-bold ${lit ? 'fill-ink dark:fill-paper' : 'fill-ink'}`}
      >
        {text}
      </text>
    </g>
  )
}
