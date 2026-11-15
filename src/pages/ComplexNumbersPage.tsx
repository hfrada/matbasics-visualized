import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { Title } from '../components/atoms/Title'
import { NoteCard } from '../components/molecules/NoteCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PlayButton } from '../components/molecules/PlayButton'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import {
  ComplexPlaneBoard,
  PlaneSwatch,
  type Coordinate,
  type Placement,
  type PlanePoint,
  type PlaneWalk,
  type PlaneWindow,
} from '../components/organisms/ComplexPlaneBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'

type TabKey = 'plot' | 'add' | 'subtract' | 'multiply' | 'divide' | 'conjugate'
type OperationKey = Exclude<TabKey, 'plot'>
type ExtraKey = 'conjugateOfZ2' | 'numerator' | 'quotient' | 'mirrorOfZ1' | 'mirrorOfZ2'

type Point = {
  x: number
  y: number
  tex: string
  plain: string
  at: Placement
  step?: number
  result?: boolean
  extra?: ExtraKey
  laterTex?: string
  laterFrom?: number
  aTex?: string
  bTex?: string
}

type Walk = {
  from: Coordinate
  to: Coordinate
  step: number
  tex?: string
  at?: Placement
  labelAt?: number
  shift?: number
  owner?: number
}

type Example = {
  window: PlaneWindow
  steps: number
  points: Point[]
  walks?: Walk[]
  mirrors?: { from: Coordinate; to: Coordinate; step: number }[]
  rays?: { from: Coordinate; to: Coordinate; step: number }[]
  marks?: { tex: string; step: number }[]
  rule?: string
  lineSteps?: number[]
}

const tabKeys: TabKey[] = ['plot', 'add', 'subtract', 'multiply', 'divide', 'conjugate']
const delays = [0.5, 1, 1.5, 2, 3]

const symbolLabels: Record<Exclude<OperationKey, 'conjugate'>, string> = {
  add: 'z₁ + z₂',
  subtract: 'z₁ − z₂',
  multiply: 'z₁ · z₂',
  divide: 'z₁ / z₂',
}

const z1: Point = { x: 1, y: 2, tex: 'z_1 = 1 + 2i', plain: 'z₁ = 1 + 2i', at: 'nw' }
const z2: Point = { x: 2, y: -3, tex: 'z_2 = 2 - 3i', plain: 'z₂ = 2 − 3i', at: 'se' }
const knownTex = ['z_1 = 1 + 2i', 'z_2 = 2 - 3i']

const examples: Record<TabKey, Example> = {
  plot: {
    window: { x: [-3, 3], y: [-3, 3] },
    steps: 4,
    points: [
      { x: 1, y: 2, tex: 'z_1 = 1 + 2i', plain: 'z₁ = 1 + 2i', at: 'ne', step: 0 },
      { x: -2, y: 1, tex: 'z_2 = -2 + i', plain: 'z₂ = −2 + i', at: 'nw', step: 1 },
      { x: -1, y: -2, tex: 'z_3 = -1 - 2i', plain: 'z₃ = −1 − 2i', at: 'sw', step: 2 },
      { x: 2, y: -1, tex: 'z_4 = 2 - i', plain: 'z₄ = 2 − i', at: 'se', step: 3 },
    ],
  },
  add: {
    window: { x: [-1, 4], y: [-4, 3] },
    steps: 3,
    rule: '(a_1 + b_1 i) + (a_2 + b_2 i) = (a_1 + a_2) + (b_1 + b_2)i',
    points: [
      z1,
      z2,
      { x: 3, y: -1, tex: 'z_1 + z_2 = 3 - i', plain: 'z₁ + z₂ = 3 − i', at: 'e', step: 2, result: true },
    ],
    walks: [
      { from: [1, 2], to: [3, 2], tex: '+2', at: 'n', step: 0 },
      { from: [3, 2], to: [3, -1], tex: '-3i', at: 'e', step: 1 },
    ],
    lineSteps: [0, 1, 2],
  },
  subtract: {
    window: { x: [-2, 3], y: [-4, 6] },
    steps: 3,
    rule: '(a_1 + b_1 i) - (a_2 + b_2 i) = (a_1 - a_2) + (b_1 - b_2)i',
    points: [
      { ...z1, at: 'e' },
      { ...z2, at: 'e' },
      { x: -1, y: 5, tex: 'z_1 - z_2 = -1 + 5i', plain: 'z₁ − z₂ = −1 + 5i', at: 'w', step: 2, result: true },
    ],
    walks: [
      { from: [1, 2], to: [-1, 2], tex: '-2', at: 'n', step: 0, labelAt: 0.25 },
      { from: [-1, 2], to: [-1, 5], tex: '+3i', at: 'w', step: 1 },
    ],
    lineSteps: [0, 1, 2],
  },
  multiply: {
    window: { x: [-1, 9], y: [-4, 3] },
    steps: 5,
    rule: '(a_1 + b_1 i)(a_2 + b_2 i) = (a_1 a_2 - b_1 b_2) + (a_1 b_2 + a_2 b_1)i',
    points: [
      z1,
      z2,
      { x: 8, y: 1, tex: 'z_1 \\cdot z_2 = 8 + i', plain: 'z₁ · z₂ = 8 + i', at: 'n', step: 4, result: true },
    ],
    walks: [
      { from: [0, 0], to: [2, 0], tex: '2', at: 'n', step: 0 },
      { from: [2, 0], to: [2, -3], tex: '-3i', at: 'w', step: 1 },
      { from: [2, -3], to: [2, 1], tex: '4i', at: 'e', step: 2, shift: 7 },
      { from: [2, 1], to: [8, 1], tex: '6', at: 'n', step: 3 },
    ],
    lineSteps: [0, 3, 4],
  },
  divide: {
    window: { x: [-5, 3], y: [-4, 8] },
    steps: 4,
    rule: '\\frac{z_1}{z_2} = \\frac{z_1}{z_2} \\cdot \\frac{\\bar{z}_2}{\\bar{z}_2} = \\frac{a_1 a_2 + b_1 b_2}{a_2^2 + b_2^2} + \\frac{a_2 b_1 - a_1 b_2}{a_2^2 + b_2^2}\\, i',
    points: [
      { ...z1, tex: 'z_1' },
      { ...z2, tex: 'z_2', at: 'e' },
      {
        x: 2,
        y: 3,
        tex: '\\bar{z}_2 = 2 + 3i',
        plain: 'z̄₂ = 2 + 3i',
        at: 'e',
        step: 0,
        extra: 'conjugateOfZ2',
      },
      {
        x: -4,
        y: 7,
        tex: 'z_1 \\cdot \\bar{z}_2 = -4 + 7i',
        plain: 'z₁ · z̄₂ = −4 + 7i',
        at: 'w',
        step: 2,
        extra: 'numerator',
      },
      {
        x: -4 / 13,
        y: 7 / 13,
        aTex: '-\\tfrac{4}{13}',
        bTex: '\\tfrac{7}{13}',
        tex: '\\tfrac{z_1}{z_2} = -\\tfrac{4}{13} + \\tfrac{7}{13}i',
        plain: 'z₁ / z₂ = −4/13 + 7/13 i',
        at: 'w',
        step: 3,
        result: true,
        extra: 'quotient',
      },
    ],
    mirrors: [{ from: [2, -3], to: [2, 3], step: 0 }],
    rays: [{ from: [0, 0], to: [-4, 7], step: 3 }],
    marks: [{ tex: 'z_2 \\cdot \\bar{z}_2 = 13 \\rightarrow', step: 1 }],
    lineSteps: [0, 1, 2, 3],
  },
  conjugate: {
    window: { x: [-2, 3], y: [-6, 6] },
    steps: 5,
    rule: 'z = a + bi \\;\\Rightarrow\\; \\bar{z} = a - bi',
    points: [
      { ...z1, tex: 'z_1', at: 'w' },
      { ...z2, tex: 'z_2', at: 'e' },
      { x: 1, y: -2, tex: '\\bar{z}_1', plain: 'z̄₁ = 1 − 2i', at: 'w', step: 0, extra: 'mirrorOfZ1' },
      { x: 2, y: 3, tex: '\\bar{z}_2', plain: 'z̄₂ = 2 + 3i', at: 'e', step: 1, extra: 'mirrorOfZ2' },
      { x: -1, y: 5, tex: 'z_1 - z_2 = -1 + 5i', plain: 'z₁ − z₂ = −1 + 5i', at: 'w', step: 3 },
      {
        x: -1,
        y: -5,
        tex: '\\bar{z}_1 - \\bar{z}_2 = -1 - 5i',
        laterTex: '\\bar{z}_1 - \\bar{z}_2 = \\overline{z_1 - z_2} = -1 - 5i',
        laterFrom: 4,
        plain: 'z̄₁ − z̄₂ = −1 − 5i',
        at: 'w',
        step: 2,
        result: true,
      },
    ],
    mirrors: [
      { from: [1, 2], to: [1, -2], step: 0 },
      { from: [2, -3], to: [2, 3], step: 1 },
      { from: [-1, 5], to: [-1, -5], step: 4 },
    ],
    lineSteps: [0, 1, 2, 3, 4],
  },
}

const productHeads = { columns: ['2', '-3i'], rows: ['1', '2i'] }
const productCells = [
  { tex: '2', real: true, step: 0 },
  { tex: '-3i', real: false, step: 1 },
  { tex: '4i', real: false, step: 2 },
  { tex: '-6i^2 = 6', real: true, step: 3, flip: true },
]

const twoFormsTex = [
  '\\mathbb{C} = \\{ z \\mid z = (x, y);\\ x = \\mathrm{Re}(z),\\ y = \\mathrm{Im}(z) \\}',
  '\\mathbb{C} = \\{ z \\mid z = a + bi;\\ a, b \\in \\mathbb{R},\\ i^2 = -1 \\}',
]

const legendTex = [
  { key: 're', tex: '\\mathrm{Re}(z)' },
  { key: 'im', tex: '\\mathrm{Im}(z)' },
  { key: 'i', tex: 'i' },
  { key: 'conjugate', tex: '\\bar{z}' },
] as const

const legendSwatches = ['walk', 'mirror', 'guide', 'result'] as const

function numberTex(value: number) {
  return value < 0 ? `-${-value}` : `${value}`
}

function plotWalks(points: Point[]): Walk[] {
  return points.flatMap((point, index) => [
    { from: [0, 0], to: [point.x, 0], step: index, owner: index },
    { from: [point.x, 0], to: [point.x, point.y], step: index, owner: index },
  ])
}

export function ComplexNumbersPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.complexNumbers' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('complexNumbers')
  const [tab, setTab] = useState<TabKey>('plot')
  const [selected, setSelected] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const example = examples[tab]
  const plotting = tab === 'plot'
  const player = useStepPlayer({ steps: example.steps, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const picked = current === null ? selected : null
  const captions = t(`examples.${tab}.captions`, { returnObjects: true })

  const shown = (step?: number) => step === undefined || current === null || current >= step
  const isNow = (step?: number) => step !== undefined && current === step
  const pointTex = (point: Point) => (point.laterTex && shown(point.laterFrom) ? point.laterTex : point.tex)
  const lineClass = (step: number) => (isNow(step) ? 'bg-highlight-soft' : shown(step) ? '' : 'opacity-25')

  const points: PlanePoint[] = example.points.flatMap((point, index) => {
    if (!shown(point.step)) return []
    let guide: PlanePoint['guide'] = 'none'
    if (picked === index) guide = 'picked'
    else if (!point.result && (plotting || point.step === undefined)) guide = 'faint'
    return [
      {
        id: index,
        x: point.x,
        y: point.y,
        labelTex: pointTex(point),
        placement: point.at,
        ariaLabel: point.plain,
        result: Boolean(point.result),
        marked: isNow(point.step) || picked === index,
        guide,
      },
    ]
  })

  const walks: PlaneWalk[] = (plotting ? plotWalks(example.points) : (example.walks ?? []))
    .filter((walk) => (plotting ? isNow(walk.step) || (picked !== null && picked === walk.owner) : shown(walk.step)))
    .map((walk) => ({
      from: walk.from,
      to: walk.to,
      labelTex: walk.tex,
      placement: walk.at ?? 'n',
      labelAt: walk.labelAt ?? 0.5,
      shift: walk.shift ?? 0,
      now: isNow(walk.step),
    }))

  function reading(point: Point) {
    const a = point.aTex ?? numberTex(point.x)
    const b = point.bTex ?? numberTex(point.y)
    const horizontal = t(point.x > 0 ? 'note.right' : 'note.left', { size: a.replace(/^-/, '') })
    const vertical = t(point.y > 0 ? 'note.above' : 'note.below', { size: b.replace(/^-/, '') })
    return t('note.reading', { a, b, horizontal, vertical })
  }

  function chooseTab(next: TabKey) {
    player.stop()
    setSelected(null)
    setTab(next)
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelected(null)
    player.start()
  }

  const selectedPoint = picked === null ? null : example.points[picked]
  const cardClass = 'pen-border relative min-w-0 bg-paper px-4.5 py-3'
  const cardTitleClass = 'font-hand text-2xl font-bold'

  function plotCards() {
    return (
      <>
        <div className={cardClass}>
          <h2 className={cardTitleClass}>{t('cards.twoForms')}</h2>
          {twoFormsTex.map((tex) => (
            <MathTex key={tex} tex={tex} className="relative block overflow-x-auto py-1.5 text-[17px]" />
          ))}
          <p className="text-[15px] text-muted">
            <MathText text={t('twoFormsFootnote')} />
          </p>
        </div>
        <div className={cardClass}>
          <h2 className={cardTitleClass}>
            <MathText text={t('cards.whyI')} />
          </h2>
          <p className="text-[17px] leading-relaxed">
            <MathText text={t('whyIText')} />
          </p>
        </div>
        <div className={`${cardClass} sm:col-span-2`}>
          <h2 className={cardTitleClass}>{t('cards.readPoints')}</h2>
          <div className="relative overflow-x-auto">
            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr className="font-hand text-[21px]">
                  <th className="py-0.5 pr-2 text-left font-bold">{t('table.number')}</th>
                  <th className="py-0.5 pr-2 text-left font-bold">{t('table.point')}</th>
                  <th className="py-0.5 pr-2 text-left font-bold">
                    <MathTex tex="\mathrm{Re}(z)" className="text-[0.75em]" />
                  </th>
                  <th className="py-0.5 pr-2 text-left font-bold">
                    <MathTex tex="\mathrm{Im}(z)" className="text-[0.75em]" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {example.points.map((point, index) => (
                  <tr
                    key={point.plain}
                    className={`border-t border-dashed border-faint transition-opacity duration-300 ${lineClass(index)}`}
                  >
                    <td className="py-1 pr-2">
                      <MathTex tex={point.tex} />
                    </td>
                    <td className="py-1 pr-2">
                      <MathTex tex={`(${numberTex(point.x)}, ${numberTex(point.y)})`} />
                    </td>
                    <td className="py-1 pr-2">
                      <MathTex tex={numberTex(point.x)} />
                    </td>
                    <td className="py-1 pr-2">
                      <MathTex tex={numberTex(point.y)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  }

  function operationCards(operation: OperationKey) {
    const lines = t(`lines.${operation}`, { returnObjects: true })
    return (
      <>
        <div className={cardClass}>
          <h2 className={cardTitleClass}>{t('cards.known')}</h2>
          {knownTex.map((tex) => (
            <MathTex key={tex} tex={tex} className="block py-0.5 text-[17px]" />
          ))}
          <p className="mt-2 text-sm text-muted">{t('cards.rule')}</p>
          <MathTex
            tex={`\\displaystyle ${example.rule ?? ''}`}
            className="relative block overflow-x-auto py-1 text-[15px]"
          />
        </div>
        <div className={cardClass}>
          <h2 className={cardTitleClass}>{t('cards.compute')}</h2>
          {lines.map((line, index) => {
            const step = example.lineSteps?.[index] ?? 0
            return (
              <div
                key={line}
                className={`relative -mx-1.5 overflow-x-auto overflow-y-hidden rounded px-1.5 py-0.5 text-[17px] whitespace-nowrap transition-opacity duration-300 ${lineClass(step)}`}
              >
                <MathText text={line} />
              </div>
            )
          })}
        </div>
        {operation === 'multiply' && (
          <div className={`${cardClass} sm:col-span-2`}>
            <h2 className={cardTitleClass}>{t('cards.product')}</h2>
            <div className="grid grid-cols-[64px_repeat(2,minmax(0,1fr))] gap-1.5 text-center">
              <MathTex tex="\cdot" className="grid min-h-14 place-content-center text-[17px]" />
              {productHeads.columns.map((tex) => (
                <MathTex key={tex} tex={tex} className="grid min-h-14 place-content-center text-[17px]" />
              ))}
              {productHeads.rows.map((rowTex, row) => (
                <div key={rowTex} className="contents">
                  <MathTex tex={rowTex} className="grid min-h-14 place-content-center text-[17px]" />
                  {productCells.slice(row * 2, row * 2 + 2).map((cell) => (
                    <div
                      key={cell.tex}
                      className={`grid min-h-14 place-content-center rounded border-[1.6px] border-ink transition-opacity duration-300 ${cell.real ? 'bg-highlight-soft' : 'bg-paper'} ${shown(cell.step) ? '' : 'opacity-25'} ${isNow(cell.step) ? 'outline-[2.5px] outline-offset-2 outline-marker outline-solid' : ''}`}
                    >
                      <MathTex tex={cell.tex} />
                      <span className="text-xs text-muted">{t(cell.real ? 'productTags.real' : 'productTags.imaginary')}</span>
                      {cell.flip && <MathTex tex="i^2 = -1" className="text-xs text-marker" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-sm text-muted">
              <MathText text={t('productTags.footnote')} />
            </p>
          </div>
        )}
      </>
    )
  }

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup
            options={tabKeys.map((key) => ({
              value: key,
              label: key === 'plot' || key === 'conjugate' ? t(`tabs.${key}`) : symbolLabels[key],
            }))}
            value={tab}
            onChange={chooseTab}
          />
          <PenSelect
            label={tPlayback('delay')}
            options={delays.map((value) => ({ value, label: tPlayback('seconds', { value }) }))}
            value={delay}
            onChange={setDelay}
          />
          <PlayButton
            playing={player.playing}
            startLabel={tPlayback('start')}
            stopLabel={tPlayback('stop')}
            onClick={togglePlayback}
          />
        </>
      }
      board={
        <div className="pen-border relative bg-paper p-2">
          <p className="mx-2 mt-1 font-hand text-2xl leading-none font-bold">{t('boardTitle')}</p>
          <ComplexPlaneBoard
            window={example.window}
            ariaLabel={t('boardTitle')}
            points={points}
            walks={walks}
            mirrors={(example.mirrors ?? [])
              .filter((mirror) => shown(mirror.step))
              .map((mirror) => ({ from: mirror.from, to: mirror.to, now: isNow(mirror.step) }))}
            rays={(example.rays ?? []).filter((ray) => shown(ray.step))}
            marks={(example.marks ?? [])
              .filter((mark) => shown(mark.step))
              .map((mark) => ({ tex: mark.tex, now: isNow(mark.step) }))}
            interactive={!player.playing}
            onSelectPoint={(index) => setSelected((value) => (value === index ? null : index))}
          />
        </div>
      }
      progress={
        <StepProgress
          total={example.steps}
          current={current}
          caption={current !== null && <MathText text={captions[current]} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={<div className="grid gap-5 sm:grid-cols-2">{plotting ? plotCards() : operationCards(tab)}</div>}
      detail={
        <NoteCard title={selectedPoint && <MathTex tex={pointTex(selectedPoint)} className="text-[0.75em]" />}>
          {selectedPoint ? (
            <>
              <p>
                <MathText text={reading(selectedPoint)} />
              </p>
              {selectedPoint.extra && (
                <p className="mt-2">
                  <MathText text={t(`extras.${selectedPoint.extra}`)} />
                </p>
              )}
            </>
          ) : (
            <>
              <p>
                <MathText text={t(`examples.${tab}.intro`)} />
              </p>
              <p className="mt-2">
                <MathText text={t(`examples.${tab}.summary`)} />
              </p>
              <p className="mt-2 text-xl text-muted">{t(`examples.${tab}.hint`)}</p>
            </>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 border-t border-dashed border-faint pt-3">
            {legendTex.map((entry) => (
              <div key={entry.key} className="contents">
                <dt className="text-center">
                  <MathTex tex={entry.tex} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">
                  <MathText text={t(`symbols.${entry.key}`)} />
                </dd>
              </div>
            ))}
            {legendSwatches.map((kind) => (
              <div key={kind} className="contents">
                <dt>
                  <PlaneSwatch kind={kind} />
                </dt>
                <dd className="text-muted">{t(`symbols.${kind}`)}</dd>
              </div>
            ))}
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
