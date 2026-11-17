import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { Stamp } from '../components/atoms/Stamp'
import { TabButton } from '../components/atoms/TabButton'
import { Title } from '../components/atoms/Title'
import { FormulaList } from '../components/molecules/FormulaList'
import { NoteCard } from '../components/molecules/NoteCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PenSlider } from '../components/molecules/PenSlider'
import { PlayButton } from '../components/molecules/PlayButton'
import { SolutionSchematic } from '../components/molecules/SolutionSchematic'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { TitledCard } from '../components/molecules/TitledCard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { InequalityStepsTable, type StepTableRow } from '../components/organisms/InequalityStepsTable'
import { SolutionLineBoard } from '../components/organisms/SolutionLineBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  chain,
  evaluateAlternatives,
  inSolutionSet,
  solutionEnds,
  type Polynomial,
  type RelationChain,
  type SolutionEnd,
  type SolutionSet,
} from '../lib/inequality'
import { numberLabel, numberTex } from '../lib/numberLabel'

type GroupKey = 'compare' | 'linear' | 'chained' | 'bothSides'
type SampleKey =
  | 'equationLinear'
  | 'equationSquare'
  | 'inequalityBasic'
  | 'linearPositive'
  | 'linearNegative'
  | 'chainedOpen'
  | 'chainedClosed'
  | 'bothSidesKept'
  | 'bothSidesFlipped'
type FormKey = 'lt' | 'le' | 'gt' | 'ge' | 'oo' | 'oc' | 'co' | 'cc'
type CountKey = 'one' | 'two' | 'infinite'
type ReasonKey = 'add' | 'addEach' | 'subtractEach' | 'simplify' | 'divideKept' | 'divideFlipped' | 'readBackward' | 'factor' | 'zeroFactor'
type LegendKey = 'closed' | 'open' | 'set' | 'probeIn' | 'probeOut'
type StepRow = { tex: string; reason: { key: ReasonKey; term: string } | null; test: RelationChain[] }
type Sample = {
  chip: string
  start: number
  rows: StepRow[]
  set: SolutionSet
  setTex: string
  intervalTex: string | null
  form: FormKey | null
  count: CountKey
}

const groupKeys: GroupKey[] = ['compare', 'linear', 'chained', 'bothSides']
const groupSamples: Record<GroupKey, SampleKey[]> = {
  compare: ['equationLinear', 'equationSquare', 'inequalityBasic'],
  linear: ['linearPositive', 'linearNegative'],
  chained: ['chainedOpen', 'chainedClosed'],
  bothSides: ['bothSidesKept', 'bothSidesFlipped'],
}
const delays = [0.5, 1, 1.5, 2, 3]
const sliderRange = { min: -6, max: 6, step: 0.5 }
const orText = '\\text{or}'
const x: Polynomial = [0, 1]

const row = (tex: string, reason: StepRow['reason'], ...test: RelationChain[]): StepRow => ({ tex, reason, test })
const because = (key: ReasonKey, term = '') => ({ key, term })
const open = (at: number): SolutionEnd => ({ at, closed: false })
const closed = (at: number): SolutionEnd => ({ at, closed: true })
const interval = (low: SolutionEnd | null, high: SolutionEnd | null): SolutionSet => ({ kind: 'interval', low, high })
const simplify = because('simplify')

const samples: Record<SampleKey, Sample> = {
  equationLinear: {
    chip: 'x - 2 = 0',
    start: 1,
    rows: [row('x - 2 = 0', null, chain([-2, 1], '=', [0])), row('x = 2', because('add', '2'), chain(x, '=', [2]))],
    set: { kind: 'points', values: [2] },
    setTex: '\\{2\\}',
    intervalTex: null,
    form: null,
    count: 'one',
  },
  equationSquare: {
    chip: 'x^2 - \\tfrac{1}{4} = 0',
    start: 1,
    rows: [
      row('x^2 - \\tfrac{1}{4} = 0', null, chain([-0.25, 0, 1], '=', [0])),
      row('(x - \\tfrac{1}{2})(x + \\tfrac{1}{2}) = 0', because('factor'), chain([-0.25, 0, 1], '=', [0])),
      row(`x = \\tfrac{1}{2}\\ ${orText}\\ x = -\\tfrac{1}{2}`, because('zeroFactor'), chain(x, '=', [0.5]), chain(x, '=', [-0.5])),
    ],
    set: { kind: 'points', values: [-0.5, 0.5] },
    setTex: '\\{-\\tfrac{1}{2}, \\tfrac{1}{2}\\}',
    intervalTex: null,
    form: null,
    count: 'two',
  },
  inequalityBasic: {
    chip: 'x < 1',
    start: 3,
    rows: [row('x < 1', null, chain(x, '<', [1]))],
    set: interval(null, open(1)),
    setTex: '\\{x \\mid x < 1,\\ x \\in \\mathbb{R}\\}',
    intervalTex: '(-\\infty, 1)',
    form: 'lt',
    count: 'infinite',
  },
  linearPositive: {
    chip: '2x - 4 < 0',
    start: 3,
    rows: [
      row('2x - 4 < 0', null, chain([-4, 2], '<', [0])),
      row('2x - 4 + 4 < 0 + 4', because('add', '4'), chain([0, 2], '<', [4])),
      row('2x < 4', simplify, chain([0, 2], '<', [4])),
      row('x < 2', because('divideKept', '2'), chain(x, '<', [2])),
    ],
    set: interval(null, open(2)),
    setTex: '\\{x \\mid x < 2,\\ x \\in \\mathbb{R}\\}',
    intervalTex: '(-\\infty, 2)',
    form: 'lt',
    count: 'infinite',
  },
  linearNegative: {
    chip: '-2x + 4 < 0',
    start: 1,
    rows: [
      row('-2x + 4 < 0', null, chain([4, -2], '<', [0])),
      row('-2x + 4 + (-4) < 0 + (-4)', because('add', '-4'), chain([0, -2], '<', [-4])),
      row('-2x < -4', simplify, chain([0, -2], '<', [-4])),
      row('x > 2', because('divideFlipped', '-2'), chain(x, '>', [2])),
    ],
    set: interval(open(2), null),
    setTex: '\\{x \\mid x > 2,\\ x \\in \\mathbb{R}\\}',
    intervalTex: '(2, \\infty)',
    form: 'gt',
    count: 'infinite',
  },
  chainedOpen: {
    chip: '0 < 2x - 2 \\le 4',
    start: 1,
    rows: [
      row('0 < 2x - 2 \\le 4', null, chain([0], '<', [-2, 2], '<=', [4])),
      row('0 + 2 < 2x - 2 + 2 \\le 4 + 2', because('addEach', '2'), chain([2], '<', [0, 2], '<=', [6])),
      row('2 < 2x \\le 6', simplify, chain([2], '<', [0, 2], '<=', [6])),
      row('1 < x \\le 3', because('divideKept', '2'), chain([1], '<', x, '<=', [3])),
    ],
    set: interval(open(1), closed(3)),
    setTex: '\\{x \\mid 1 < x \\le 3,\\ x \\in \\mathbb{R}\\}',
    intervalTex: '(1, 3]',
    form: 'oc',
    count: 'infinite',
  },
  chainedClosed: {
    chip: '10 \\ge 2x + 6 \\ge 4',
    start: 3,
    rows: [
      row('10 \\ge 2x + 6 \\ge 4', null, chain([10], '>=', [6, 2], '>=', [4])),
      row('4 \\ge 2x \\ge -2', because('subtractEach', '6'), chain([4], '>=', [0, 2], '>=', [-2])),
      row('2 \\ge x \\ge -1', because('divideKept', '2'), chain([2], '>=', x, '>=', [-1])),
      row('-1 \\le x \\le 2', because('readBackward'), chain([-1], '<=', x, '<=', [2])),
    ],
    set: interval(closed(-1), closed(2)),
    setTex: '\\{x \\mid -1 \\le x \\le 2,\\ x \\in \\mathbb{R}\\}',
    intervalTex: '[-1, 2]',
    form: 'cc',
    count: 'infinite',
  },
  bothSidesKept: {
    chip: '5x + 6 < 3x + 14',
    start: 5,
    rows: [
      row('5x + 6 < 3x + 14', null, chain([6, 5], '<', [14, 3])),
      row('5x + 6 + (-3x - 6) < 3x + 14 + (-3x - 6)', because('add', '(-3x - 6)'), chain([0, 2], '<', [8])),
      row('2x < 8', simplify, chain([0, 2], '<', [8])),
      row('x < 4', because('divideKept', '2'), chain(x, '<', [4])),
    ],
    set: interval(null, open(4)),
    setTex: '\\{x \\mid x < 4,\\ x \\in \\mathbb{R}\\}',
    intervalTex: '(-\\infty, 4)',
    form: 'lt',
    count: 'infinite',
  },
  bothSidesFlipped: {
    chip: '-2x + 10 \\ge 3x - 5',
    start: 4,
    rows: [
      row('-2x + 10 \\ge 3x - 5', null, chain([10, -2], '>=', [-5, 3])),
      row('-2x + 10 + (-3x - 10) \\ge 3x - 5 + (-3x - 10)', because('add', '(-3x - 10)'), chain([0, -5], '>=', [-15])),
      row('-5x \\ge -15', simplify, chain([0, -5], '>=', [-15])),
      row('x \\le 3', because('divideFlipped', '-5'), chain(x, '<=', [3])),
    ],
    set: interval(null, closed(3)),
    setTex: '\\{x \\mid x \\le 3,\\ x \\in \\mathbb{R}\\}',
    intervalTex: '(-\\infty, 3]',
    form: 'le',
    count: 'infinite',
  },
}

const otherFormulas: Record<GroupKey, string[]> = {
  compare: [
    '2x = 6 \\;\\Rightarrow\\; x = 3',
    '3x + 12 = 3 \\;\\Rightarrow\\; x = -3',
    'x^2 - x = 0 \\;\\Rightarrow\\; x(x - 1) = 0',
    'x^2 + x - 2 = 0 \\;\\Rightarrow\\; (x + 2)(x - 1) = 0',
    'x^3 - 2x = 0 \\;\\Rightarrow\\; x(x + \\sqrt{2})(x - \\sqrt{2}) = 0',
    'x^4 - 10x^2 + 9 = 0 \\;\\Rightarrow\\; (x + 3)(x - 3)(x + 1)(x - 1) = 0',
  ],
  linear: [
    '2x \\le -5 \\;\\Rightarrow\\; x \\le -\\tfrac{5}{2}',
    '-2x > 9 \\;\\Rightarrow\\; x < -4\\tfrac{1}{2}',
    '2x > -5 \\;\\Rightarrow\\; x > -2\\tfrac{1}{2}',
    '-2x \\le 9 \\;\\Rightarrow\\; x \\ge -\\tfrac{9}{2}',
  ],
  chained: [
    '6 \\le 4x + 2 < 8 \\;\\Rightarrow\\; 4 \\le 4x < 6 \\;\\Rightarrow\\; 1 \\le x < \\tfrac{6}{4}',
    '11 > 3x - 7 \\ge -2 \\;\\Rightarrow\\; 18 > 3x \\ge 5 \\;\\Rightarrow\\; 6 > x \\ge \\tfrac{5}{3}',
  ],
  bothSides: [
    '-3x - 6 \\ge 5x + 5 \\;\\Rightarrow\\; -8x \\ge 11 \\;\\Rightarrow\\; x \\le -\\tfrac{11}{8}',
    '3x + 7 < -2x - 3 \\;\\Rightarrow\\; 5x < -10 \\;\\Rightarrow\\; x < -2',
  ],
}

const forms: { key: FormKey; inequality: string; interval: string; set: SolutionSet }[] = [
  { key: 'lt', inequality: 'x < a', interval: '(-\\infty, a)', set: interval(null, open(0)) },
  { key: 'le', inequality: 'x \\le a', interval: '(-\\infty, a]', set: interval(null, closed(0)) },
  { key: 'gt', inequality: 'x > a', interval: '(a, \\infty)', set: interval(open(0), null) },
  { key: 'ge', inequality: 'x \\ge a', interval: '[a, \\infty)', set: interval(closed(0), null) },
  { key: 'oo', inequality: 'a < x < b', interval: '(a, b)', set: interval(open(0), open(1)) },
  { key: 'oc', inequality: 'a < x \\le b', interval: '(a, b]', set: interval(open(0), closed(1)) },
  { key: 'co', inequality: 'a \\le x < b', interval: '[a, b)', set: interval(closed(0), open(1)) },
  { key: 'cc', inequality: 'a \\le x \\le b', interval: '[a, b]', set: interval(closed(0), closed(1)) },
]

const footnoteClass = 'mt-4.5 text-[15px] text-muted'
const legendIconClass = 'block h-5.5 w-11'

export function InequalitiesPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.inequalities' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('inequalities')
  const [group, setGroup] = useState<GroupKey>('compare')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [tested, setTested] = useState<Partial<Record<SampleKey, number>>>({})
  const [delay, setDelay] = useState(1.5)

  const sampleKey = groupSamples[group][exampleIndex]
  const sample = samples[sampleKey]
  const total = sample.rows.length + 1
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const captions = t(`samples.${sampleKey}.steps`, { returnObjects: true })
  const setShown = current === null || current === sample.rows.length
  const value = tested[sampleKey] ?? sample.start
  const satisfied = inSolutionSet(sample.set, value)
  const orWord = t('words.or')
  const localize = (tex: string) => tex.replaceAll(orText, `\\text{${orWord}}`)

  function chooseGroup(next: GroupKey) {
    player.stop()
    setExampleIndex(0)
    setGroup(next)
  }

  function chooseExample(index: number) {
    player.stop()
    setExampleIndex(index)
  }

  function test(next: number) {
    setTested((previous) => ({ ...previous, [sampleKey]: next }))
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    player.start()
  }

  const tableRows: StepTableRow[] = sample.rows.map((item, index) => {
    const result = evaluateAlternatives(item.test, value, orWord)
    return {
      key: item.tex,
      tex: localize(item.tex),
      reason: item.reason ? t(`reasons.${item.reason.key}`, { term: item.reason.term }) : null,
      flip: item.reason?.key === 'divideFlipped',
      testTex: result.tex,
      holds: result.holds,
      visible: current === null || index <= current,
      now: current === index,
    }
  })

  function readingKey() {
    if (sample.rows.length === 1) return satisfied ? 'reading.insideSingle' : 'reading.outsideSingle'
    return satisfied ? 'reading.inside' : 'reading.outside'
  }

  function waysCard() {
    const lines: { key: 'line' | 'set' | 'interval'; content: ReactNode }[] = [
      { key: 'line', content: <SolutionSchematic set={sample.set} labels={solutionEnds(sample.set).map(numberLabel)} width={200} /> },
      {
        key: 'set',
        content: (
          <span className="block overflow-x-auto overflow-y-hidden">
            <MathTex tex={sample.setTex} />
          </span>
        ),
      },
      {
        key: 'interval',
        content: sample.intervalTex ? <MathTex tex={sample.intervalTex} /> : <span className="text-muted">{t('ways.notInterval')}</span>,
      },
    ]
    return (
      <TitledCard title={t('cards.ways')}>
        <div data-ways className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3">
          {lines.map((line) => (
            <div key={line.key} className="contents">
              <span className="font-hand text-[21px] leading-none text-muted">{t(`ways.${line.key}`)}</span>
              <span className="min-w-0">{line.content}</span>
            </div>
          ))}
        </div>
        <p className={footnoteClass}>
          <MathText text={t(`counts.${sample.count}`)} />
        </p>
      </TitledCard>
    )
  }

  function othersCard() {
    const remarks = t(`others.${group}`, { returnObjects: true })
    return (
      <TitledCard title={t('cards.others')}>
        <FormulaList items={otherFormulas[group].map((tex, index) => ({ key: tex, tex, remark: remarks[index] }))} />
      </TitledCard>
    )
  }

  function formsCard() {
    const cellClass = 'border-t border-dashed border-faint py-3 pr-4 align-middle text-[15px]'
    return (
      <TitledCard title={t('cards.forms')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-hand text-[21px] leading-tight font-bold">
                <th className="pr-4 pb-3 pl-2">{t('forms.inequality')}</th>
                <th className="pr-4 pb-3">{t('forms.interval')}</th>
                <th className="pr-4 pb-3">{t('forms.line')}</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => {
                const active = form.key === sample.form
                return (
                  <tr key={form.key} data-form={form.key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                    <td className={`${cellClass} pl-2`}>
                      <MathTex tex={form.inequality} />
                    </td>
                    <td className={cellClass}>
                      <MathTex tex={form.interval} />
                    </td>
                    <td className={cellClass}>
                      <SolutionSchematic set={form.set} labels={null} width={96} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className={footnoteClass}>
          <MathText text={t('forms.footnote')} />
        </p>
      </TitledCard>
    )
  }

  const axis = <line x1={2} x2={42} y1={11} y2={11} strokeWidth={1.6} className="stroke-ink" />
  const probe = (tone: string) => <path d="M15 4 h14 l-7 12 z" className={tone} />
  const legendItems: { key: LegendKey; icon: ReactNode }[] = [
    { key: 'closed', icon: <>{axis}<circle cx={22} cy={11} r={5} className="fill-ink" /></> },
    { key: 'open', icon: <>{axis}<circle cx={22} cy={11} r={5} strokeWidth={2.2} className="fill-paper stroke-ink" /></> },
    {
      key: 'set',
      icon: (
        <>
          <rect x={6} y={5} width={32} height={12} className="fill-highlight" />
          {axis}
          <line x1={6} x2={38} y1={11} y2={11} strokeWidth={4} className="stroke-ink" />
        </>
      ),
    },
    { key: 'probeIn', icon: probe('fill-ink') },
    { key: 'probeOut', icon: probe('fill-marker') },
  ]

  const answer = sample.intervalTex ?? sample.setTex
  const variable = <i className="font-math-italic">x</i>

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup options={groupKeys.map((key) => ({ value: key, label: t(`groups.${key}`) }))} value={group} onChange={chooseGroup} />
          <PenSelect
            label={tPlayback('delay')}
            options={delays.map((seconds) => ({ value: seconds, label: tPlayback('seconds', { value: seconds }) }))}
            value={delay}
            onChange={setDelay}
          />
          <PlayButton
            playing={player.playing}
            startLabel={tPlayback('start')}
            stopLabel={tPlayback('stop')}
            onClick={togglePlayback}
          />
          <div data-examples className="flex min-h-10 basis-full flex-wrap items-baseline gap-x-6.5 gap-y-3">
            {groupSamples[group].map((key, index) => (
              <TabButton key={key} data-example={key} active={index === exampleIndex} onClick={() => chooseExample(index)}>
                <MathTex tex={samples[key].chip} className="[&_.katex]:text-[0.74em]!" />
              </TabButton>
            ))}
          </div>
        </>
      }
      board={
        <TitledCard title={t(`groups.${group}`)}>
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <MathTex tex={localize(sample.rows[0].tex)} className="[&_.katex]:text-[1.35em]!" />
            {setShown ? (
              <Stamp tone="yes">
                <MathTex tex={answer} />
              </Stamp>
            ) : (
              <Stamp tone="pending">?</Stamp>
            )}
          </div>
          <InequalityStepsTable
            rows={tableRows}
            stepHeader={t('table.step')}
            testHeader={
              <>
                {t('table.test')} <MathTex tex={`x = ${numberTex(value)}`} />
              </>
            }
            verdicts={{ holds: t('table.holds'), fails: t('table.fails') }}
          />
          <div className="mt-3">
            <SolutionLineBoard set={setShown ? sample.set : null} x={value} satisfied={satisfied} ariaLabel={t('aria.line')} />
          </div>
          <PenSlider
            label={
              <>
                {t('slider')} {variable}
              </>
            }
            ariaLabel={t('aria.slider')}
            valueText={
              <>
                {variable} = {numberLabel(value)}
              </>
            }
            min={sliderRange.min}
            max={sliderRange.max}
            step={sliderRange.step}
            value={value}
            disabled={false}
            onChange={test}
          />
          <p data-reading className="mt-2.5 min-h-[1.6em] text-[17px] [&_.katex]:text-[1.15em]!">
            <MathText text={t(readingKey(), { x: numberTex(value) })} />
          </p>
        </TitledCard>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={current !== null && <MathText text={captions[current]} />}
          idleText={t('idle')}
        />
      }
      stage={
        <div className="grid gap-6 sm:grid-cols-2">
          {waysCard()}
          {othersCard()}
          {formsCard()}
        </div>
      }
      detail={
        <NoteCard>
          <p className="mb-3.5">
            <MathText text={t(`intros.${group}`)} />
          </p>
          <p className="text-muted">
            <MathText text={t('tip')} />
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-t border-dashed border-faint pt-3">
            {legendItems.map((item) => (
              <div key={item.key} className="contents">
                <dt>
                  <svg viewBox="0 0 44 22" className={legendIconClass}>
                    {item.icon}
                  </svg>
                </dt>
                <dd className="text-muted">
                  <MathText text={t(`legend.${item.key}`)} />
                </dd>
              </div>
            ))}
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
