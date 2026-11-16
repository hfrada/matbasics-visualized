import { MathText } from '../atoms/MathText'

export type OutcomeKey = 'notDeclarative' | 'notDefinite' | 'true' | 'false'
export type SentenceStatus = 'now' | 'done' | 'later'

export type TraySentence = {
  letter: string
  text: string
  outcome: OutcomeKey
  badge: string
  status: SentenceStatus
}

export type FlowLabels = {
  start: string
  declarative: string
  definite: string
  yes: string
  no: string
  trueValue: string
  falseValue: string
  outcomes: Record<OutcomeKey, { title: string; sub: string }>
  aria: string
}

type PropositionFlowBoardProps = {
  sentences: TraySentence[]
  active: number | null
  picked: number | null
  interactive: boolean
  labels: FlowLabels
  onPick: (index: number) => void
}

type NodeKey = 'start' | 'declarative' | 'definite' | OutcomeKey
type EdgeKey = 'startToDeclarative' | 'declarativeNo' | 'declarativeYes' | 'definiteNo' | 'definiteTrue' | 'definiteFalse'
type ArrowEnd = [x: number, y: number, dx: number, dy: number]

const outcomeKeys: OutcomeKey[] = ['notDeclarative', 'notDefinite', 'true', 'false']

const nodes: Record<NodeKey, { x: number; y: number; width: number; height: number }> = {
  start: { x: 250, y: 36, width: 170, height: 44 },
  declarative: { x: 250, y: 140, width: 210, height: 52 },
  definite: { x: 250, y: 256, width: 220, height: 52 },
  notDeclarative: { x: 540, y: 140, width: 168, height: 82 },
  notDefinite: { x: 540, y: 256, width: 168, height: 82 },
  true: { x: 140, y: 392, width: 180, height: 82 },
  false: { x: 360, y: 392, width: 180, height: 82 },
}

const edges: { key: EdgeKey; path: string; end: ArrowEnd; label?: { x: number; y: number; middle: boolean } }[] = [
  { key: 'startToDeclarative', path: 'M250 58 L250 112', end: [250, 112, 0, 1] },
  { key: 'declarativeNo', path: 'M355 140 L454 140', end: [454, 140, 1, 0], label: { x: 404, y: 129, middle: true } },
  { key: 'declarativeYes', path: 'M250 166 L250 228', end: [250, 228, 0, 1], label: { x: 262, y: 203, middle: false } },
  { key: 'definiteNo', path: 'M360 256 L454 256', end: [454, 256, 1, 0], label: { x: 407, y: 245, middle: true } },
  {
    key: 'definiteTrue',
    path: 'M250 282 L250 316 L140 316 L140 349',
    end: [140, 349, 0, 1],
    label: { x: 152, y: 340, middle: false },
  },
  { key: 'definiteFalse', path: 'M250 316 L360 316 L360 349', end: [360, 349, 0, 1], label: { x: 372, y: 340, middle: false } },
]

const pathEdges: Record<OutcomeKey, EdgeKey[]> = {
  notDeclarative: ['startToDeclarative', 'declarativeNo'],
  notDefinite: ['startToDeclarative', 'declarativeYes', 'definiteNo'],
  true: ['startToDeclarative', 'declarativeYes', 'definiteTrue'],
  false: ['startToDeclarative', 'declarativeYes', 'definiteFalse'],
}

const pathNodes: Record<OutcomeKey, NodeKey[]> = {
  notDeclarative: ['start', 'declarative', 'notDeclarative'],
  notDefinite: ['start', 'declarative', 'definite', 'notDefinite'],
  true: ['start', 'declarative', 'definite', 'true'],
  false: ['start', 'declarative', 'definite', 'false'],
}

function arrowPath([x, y, dx, dy]: ArrowEnd) {
  return `M${x - dx * 7 - dy * 5} ${y - dy * 7 - dx * 5} L${x} ${y} L${x - dx * 7 + dy * 5} ${y - dy * 7 + dx * 5}`
}

function NodeBox({ node, lit, landed }: { node: NodeKey; lit: boolean; landed: boolean }) {
  const { x, y, width, height } = nodes[node]
  const fill = lit ? 'fill-highlight-soft' : 'fill-paper'
  const stroke = landed ? 'stroke-marker stroke-[2.5]' : 'stroke-ink stroke-2'
  return (
    <>
      <rect
        x={x - width / 2 + 3}
        y={y - height / 2 + 3}
        width={width}
        height={height}
        rx={5}
        className="fill-none stroke-ink stroke-1 opacity-35"
      />
      <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={4} className={`${fill} ${stroke}`} />
    </>
  )
}

export function PropositionFlowBoard({ sentences, active, picked, interactive, labels, onPick }: PropositionFlowBoardProps) {
  const activeSentence = active === null ? null : sentences[active]
  const litEdges = new Set<EdgeKey>(activeSentence ? pathEdges[activeSentence.outcome] : [])
  const litNodes = new Set<NodeKey>(activeSentence ? pathNodes[activeSentence.outcome] : [])
  const edgeLabels: Partial<Record<EdgeKey, string>> = {
    declarativeNo: labels.no,
    declarativeYes: labels.yes,
    definiteNo: labels.no,
    definiteTrue: labels.trueValue,
    definiteFalse: labels.falseValue,
  }
  const questions = [
    { key: 'declarative', text: labels.declarative },
    { key: 'definite', text: labels.definite },
  ] as const

  return (
    <>
      <div className="mt-1 mb-7 grid">
        {sentences.map((sentence, index) => {
          const now = sentence.status === 'now'
          const tone = now ? 'bg-highlight dark:text-paper' : interactive ? 'hover:bg-highlight-soft' : ''
          const proposition = sentence.outcome === 'true' || sentence.outcome === 'false'
          return (
            <button
              key={sentence.letter}
              type="button"
              aria-pressed={picked === index}
              data-outcome={sentence.outcome}
              onClick={interactive ? () => onPick(index) : undefined}
              className={`relative flex items-baseline gap-3 rounded-[4px] px-3 py-2.5 text-left ${index > 0 ? 'border-t border-dashed border-faint' : ''} ${interactive ? 'cursor-pointer' : 'cursor-default'} ${tone}`}
            >
              <span className="font-hand text-[21px] leading-none font-bold">({sentence.letter})</span>
              <span>
                <MathText text={sentence.text} />
              </span>
              {sentence.status !== 'later' && (
                <span
                  className={`ml-auto pl-2 font-hand text-xl leading-none whitespace-nowrap ${proposition ? 'font-bold' : 'font-medium text-muted'}`}
                >
                  {sentence.badge}
                </span>
              )}
              {picked === index && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-[-2px] inset-y-px rounded-[40%] border-2 border-marker"
                />
              )}
            </button>
          )
        })}
      </div>
      <svg viewBox="0 0 640 446" role="img" aria-label={labels.aria} className="block h-auto w-full">
        {edges
          .filter((edge) => litEdges.has(edge.key))
          .map((edge) => (
            <path
              key={edge.key}
              d={edge.path}
              strokeLinecap="round"
              className="fill-none stroke-highlight stroke-11 opacity-60"
            />
          ))}
        {edges.map((edge) => (
          <g key={edge.key} className="fill-none stroke-ink stroke-[1.8]">
            <path d={edge.path} />
            <path d={arrowPath(edge.end)} />
          </g>
        ))}
        {edges.map(
          (edge) =>
            edge.label && (
              <text
                key={edge.key}
                x={edge.label.x}
                y={edge.label.y}
                textAnchor={edge.label.middle ? 'middle' : 'start'}
                className="fill-muted font-hand text-[19px] font-bold"
              >
                {edgeLabels[edge.key]}
              </text>
            ),
        )}
        <g>
          <NodeBox node="start" lit={litNodes.has('start')} landed={false} />
          <text x={250} y={43} textAnchor="middle" className="fill-ink font-hand text-[22px] font-bold">
            {activeSentence ? `${labels.start} (${activeSentence.letter})` : labels.start}
          </text>
        </g>
        {questions.map((question) => (
          <g key={question.key}>
            <NodeBox node={question.key} lit={litNodes.has(question.key)} landed={false} />
            <text
              x={nodes[question.key].x}
              y={nodes[question.key].y + 7}
              textAnchor="middle"
              className="fill-ink font-hand text-[22px] font-bold"
            >
              {question.text}
            </text>
          </g>
        ))}
        {outcomeKeys.map((key) => {
          const { x, y } = nodes[key]
          const landed = activeSentence?.outcome === key
          const arrived = sentences.filter((sentence) => sentence.outcome === key && sentence.status !== 'later')
          return (
            <g key={key} data-bin={key} data-land={landed}>
              <NodeBox node={key} lit={litNodes.has(key)} landed={landed} />
              <text x={x} y={y - 17} textAnchor="middle" className="fill-ink font-hand text-[22px] font-bold">
                {labels.outcomes[key].title}
              </text>
              <text x={x} y={y + 3} textAnchor="middle" className="fill-muted text-[13px]">
                {labels.outcomes[key].sub}
              </text>
              <text x={x} y={y + 30} textAnchor="middle" className="fill-ink font-hand text-[21px] font-bold">
                {arrived.map((sentence, index) => (
                  <tspan key={sentence.letter} className={sentence.status === 'now' ? 'fill-marker' : ''}>
                    {index > 0 ? ' ' : ''}({sentence.letter})
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
      </svg>
    </>
  )
}
