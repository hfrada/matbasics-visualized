import { Fragment, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { Stamp, type StampTone } from '../components/atoms/Stamp'
import { TabButton } from '../components/atoms/TabButton'
import { Title } from '../components/atoms/Title'
import { FormulaList } from '../components/molecules/FormulaList'
import { NoteCard } from '../components/molecules/NoteCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PenSlider } from '../components/molecules/PenSlider'
import { PlayButton } from '../components/molecules/PlayButton'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { TitledCard } from '../components/molecules/TitledCard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { ShiftLinesBoard } from '../components/organisms/ShiftLinesBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { TransitiveArrowsBoard } from '../components/organisms/TransitiveArrowsBoard'
import { TrichotomyLineBoard } from '../components/organisms/TrichotomyLineBoard'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import { numberLabel, numberTex } from '../lib/numberLabel'

type LawKey = 'trichotomy' | 'transitive' | 'addition' | 'multiplication'
type ExampleKey = 'trichotomyY' | 'trichotomyZero' | 'transitiveA' | 'transitiveB'
type SampleKey = ExampleKey | 'addition' | 'multiplication'
type Phase = 'top' | 'down' | 'up'
type SliderRange = { name: 'x' | 'z'; min: number; max: number; step: number; start: number }
type TrichotomySample = { kind: 'trichotomy'; reference: number; slider: SliderRange; steps: number[] }
type TransitiveSample = { kind: 'transitive'; values: [number, number, number] }
type ShiftSample = {
  kind: 'addition' | 'multiplication'
  values: [number, number]
  range: [number, number]
  slider: SliderRange
  steps: { value: number; phase: Phase }[]
}
type Sample = TrichotomySample | TransitiveSample | ShiftSample
type SignKey = 'negative' | 'zero' | 'positive'
type RuleKey = 'trichotomy' | 'transitive' | 'addition' | 'multiplicationPositive' | 'multiplicationNegative'
type NotedRuleKey = 'trichotomy' | 'multiplicationNegative'
type LegendKey =
  | 'reference'
  | 'referenceZero'
  | 'point'
  | 'relation'
  | 'arrow'
  | 'now'
  | 'linkAddition'
  | 'linkMultiplication'
  | 'band'
  | 'crossed'
type MultiplicationOtherKey = 'double' | 'half' | 'minusFour' | 'minusTwoThirds' | 'minusTen'
type Words = { and: string; or: string }

const lawKeys: LawKey[] = ['trichotomy', 'transitive', 'addition', 'multiplication']
const lawSamples: Record<LawKey, SampleKey[]> = {
  trichotomy: ['trichotomyY', 'trichotomyZero'],
  transitive: ['transitiveA', 'transitiveB'],
  addition: ['addition'],
  multiplication: ['multiplication'],
}
const delays = [0.5, 1, 1.5, 2, 3]
const transitiveSteps = 3

const transitiveA: TransitiveSample = { kind: 'transitive', values: [3, 7, 9] }
const transitiveB: TransitiveSample = { kind: 'transitive', values: [-2, 3, 9] }

const samples: Record<SampleKey, Sample> = {
  trichotomyY: {
    kind: 'trichotomy',
    reference: 3,
    slider: { name: 'x', min: -10, max: 10, step: 1, start: -4 },
    steps: [-5, 3, 8],
  },
  trichotomyZero: {
    kind: 'trichotomy',
    reference: 0,
    slider: { name: 'x', min: -10, max: 10, step: 1, start: 5 },
    steps: [-6, 0, 4],
  },
  transitiveA,
  transitiveB,
  addition: {
    kind: 'addition',
    values: [3, 7],
    range: [-8, 18],
    slider: { name: 'z', min: -9, max: 9, step: 1, start: 9 },
    steps: [
      { value: 9, phase: 'top' },
      { value: 9, phase: 'down' },
      { value: 9, phase: 'up' },
      { value: -5, phase: 'down' },
    ],
  },
  multiplication: {
    kind: 'multiplication',
    values: [2, 4],
    range: [-12, 12],
    slider: { name: 'z', min: -3, max: 3, step: 0.5, start: 3 },
    steps: [
      { value: 3, phase: 'down' },
      { value: -3, phase: 'down' },
      { value: -0.5, phase: 'down' },
      { value: 0.5, phase: 'down' },
    ],
  },
}

const relationChips: Record<'reference' | 'zero', [string, string, string]> = {
  reference: ['x < y', 'x = y', 'x > y'],
  zero: ['x < 0', 'x = 0', 'x > 0'],
}

const ruleRows: { key: RuleKey; law: LawKey; sign: number | null }[] = [
  { key: 'trichotomy', law: 'trichotomy', sign: null },
  { key: 'transitive', law: 'transitive', sign: null },
  { key: 'addition', law: 'addition', sign: null },
  { key: 'multiplicationPositive', law: 'multiplication', sign: 1 },
  { key: 'multiplicationNegative', law: 'multiplication', sign: -1 },
]

const twoWays = [
  { key: 'forward', tex: '3 < 7 \\;\\Rightarrow\\; 3 + 9 = 12 < 16 = 7 + 9' },
  { key: 'backward', tex: '12 < 16 \\;\\Rightarrow\\; 12 - 9 = 3 < 7 = 16 - 9' },
] as const

const multiplicationOthers: { key: MultiplicationOtherKey; tex: string }[] = [
  { key: 'double', tex: '(3)(2) = 6 < 12 = (6)(2)' },
  { key: 'half', tex: '(3)(\\tfrac{1}{2}) = \\tfrac{3}{2} < 3 = (6)(\\tfrac{1}{2})' },
  { key: 'minusFour', tex: '(3)(-4) = -12 > -24 = (6)(-4)' },
  { key: 'minusTwoThirds', tex: '(3)(-\\tfrac{2}{3}) = -2 > -4 = (6)(-\\tfrac{2}{3})' },
  { key: 'minusTen', tex: '(2)(-10) = -20 > -40 = (4)(-10)' },
]

const orderingProducts = [
  'xy = (5)(-4) = -20',
  'xz = (5)(\\tfrac{1}{3}) = \\tfrac{5}{3}',
  'xw = (5)(-\\tfrac{1}{2}) = -\\tfrac{5}{2}',
  'yz = (-4)(\\tfrac{1}{3}) = -\\tfrac{4}{3}',
  'yw = (-4)(-\\tfrac{1}{2}) = 2',
  'zw = (\\tfrac{1}{3})(-\\tfrac{1}{2}) = -\\tfrac{1}{6}',
]
const orderingChains = ['xy < xw < yz < zw < xz < yw', '-20 < -\\tfrac{5}{2} < -\\tfrac{4}{3} < -\\tfrac{1}{6} < \\tfrac{5}{3} < 2']

function ruleFormula(key: RuleKey, words: Words) {
  const formulas: Record<RuleKey, string> = {
    trichotomy: `x < y \\ \\text{${words.or}}\\ x = y \\ \\text{${words.or}}\\ x > y`,
    transitive: `x < y \\ \\text{${words.and}}\\ y < z \\;\\Rightarrow\\; x < z`,
    addition: 'x < y \\iff x + z < y + z',
    multiplicationPositive: 'x < y \\iff xz < yz',
    multiplicationNegative: 'x < y \\iff xz > yz',
  }
  return formulas[key]
}

function isNotedRule(key: RuleKey): key is NotedRuleKey {
  return key === 'trichotomy' || key === 'multiplicationNegative'
}

function isExampleKey(key: SampleKey): key is ExampleKey {
  return key !== 'addition' && key !== 'multiplication'
}

function sliderValue(sample: TrichotomySample | ShiftSample, current: number | null, stored: number | undefined) {
  if (current === null) return stored ?? sample.slider.start
  return sample.kind === 'trichotomy' ? sample.steps[current] : sample.steps[current].value
}

function signKey(value: number): SignKey {
  return value < 0 ? 'negative' : value > 0 ? 'positive' : 'zero'
}

const relationOf = (a: number, b: number) => (a < b ? '<' : a > b ? '>' : '=')
const factor = (value: number) => `(${numberTex(value)})`
const term = (value: number) => (value < 0 ? factor(value) : numberTex(value))
const termLabel = (value: number) => (value < 0 ? `(${numberLabel(value)})` : numberLabel(value))

const footnoteClass = 'mt-4.5 text-[15px] text-muted'
const legendIconClass = 'block h-5.5 w-11'

export function OrderAxiomsPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.orderAxioms' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('orderAxioms')
  const [law, setLaw] = useState<LawKey>('trichotomy')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [stored, setStored] = useState<Partial<Record<SampleKey, number>>>({})
  const [delay, setDelay] = useState(1.5)

  const sampleKey = lawSamples[law][exampleIndex]
  const sample = samples[sampleKey]
  const total = sample.kind === 'transitive' ? transitiveSteps : sample.steps.length
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const captions = t(`samples.${sampleKey}.steps`, { returnObjects: true })
  const words: Words = { and: t('words.and'), or: t('words.or') }
  const shown = current === null ? transitiveSteps : current + 1
  const phase: Phase = sample.kind === 'addition' || sample.kind === 'multiplication' ? (current === null ? 'down' : sample.steps[current].phase) : 'down'
  const valueOf = (item: TrichotomySample | ShiftSample) => sliderValue(item, current, stored[sampleKey])
  const pending = { kind: 'pending' as const, content: '?' }

  function chooseLaw(next: LawKey) {
    player.stop()
    setExampleIndex(0)
    setLaw(next)
  }

  function chooseExample(index: number) {
    player.stop()
    setExampleIndex(index)
  }

  function slide(value: number) {
    setStored((previous) => ({ ...previous, [sampleKey]: value }))
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    player.start()
  }

  function figure() {
    if (sample.kind === 'trichotomy') {
      const zero = sample.reference === 0
      return (
        <TrichotomyLineBoard
          reference={sample.reference}
          referenceName={zero ? '0' : 'y'}
          x={valueOf(sample)}
          chips={relationChips[zero ? 'zero' : 'reference']}
          regions={
            zero
              ? { kind: 'halves', negative: t('figure.negative'), positive: t('figure.positive') }
              : { kind: 'around', left: t('figure.left'), right: t('figure.right') }
          }
          ariaLabel={t('aria.trichotomy')}
        />
      )
    }
    if (sample.kind === 'transitive') {
      return <TransitiveArrowsBoard values={sample.values} shown={shown} now={current} ariaLabel={t('aria.transitive')} />
    }
    const z = valueOf(sample)
    const multiply = sample.kind === 'multiplication'
    const [x, y] = sample.values
    const moved: [number, number] = multiply ? [x * z, y * z] : [x + z, y + z]
    return (
      <ShiftLinesBoard
        values={sample.values}
        moved={phase === 'top' ? null : moved}
        names={multiply ? ['xz', 'yz'] : ['x + z', 'y + z']}
        range={sample.range}
        direction={phase === 'up' ? 'up' : 'down'}
        operationLabel={multiply ? `· ${termLabel(z)}` : `+ ${termLabel(phase === 'up' ? -z : z)}`}
        titles={[t('figure.before'), t('figure.after')]}
        crossLabel={t('figure.crossed')}
        meetLabel={t('figure.meet')}
        ariaLabel={t('aria.shift')}
      />
    )
  }

  function head(): { tex: string; stamp: { kind: StampTone; content: ReactNode } } {
    if (sample.kind === 'trichotomy') {
      const x = valueOf(sample)
      if (sample.reference === 0) return { tex: `x = ${numberTex(x)}`, stamp: { kind: 'yes', content: t(`stamps.${signKey(x)}`) } }
      return {
        tex: `x = ${numberTex(x)},\\ y = ${numberTex(sample.reference)}`,
        stamp: { kind: 'yes', content: <MathTex tex={`x ${relationOf(x, sample.reference)} y`} /> },
      }
    }
    if (sample.kind === 'transitive') {
      const [a, b, c] = sample.values.map(numberTex)
      return {
        tex: `${a} < ${b}\\ \\text{${words.and}}\\ ${b} < ${c}`,
        stamp: shown === transitiveSteps ? { kind: 'yes', content: <MathTex tex={`${a} < ${c}`} /> } : pending,
      }
    }
    const z = valueOf(sample)
    const [x, y] = sample.values
    if (sample.kind === 'addition') {
      const before = `${x} < ${y}`
      const after = `${x} + ${term(z)} < ${y} + ${term(z)}`
      if (phase === 'top') return { tex: before, stamp: pending }
      const arrow = current === null ? '\\iff' : '\\Rightarrow'
      return {
        tex: phase === 'up' ? `${after} ${arrow} ${before}` : `${before} ${arrow} ${after}`,
        stamp: { kind: 'yes', content: t('stamps.kept') },
      }
    }
    if (z === 0) return { tex: `(${x})(0) = (${y})(0) = 0`, stamp: { kind: 'pending', content: <MathTex tex="z = 0" /> } }
    return {
      tex: `${x} < ${y} \\iff (${x})${factor(z)} ${relationOf(x * z, y * z)} (${y})${factor(z)}`,
      stamp: z > 0 ? { kind: 'yes', content: t('stamps.same') } : { kind: 'flip', content: t('stamps.flipped') },
    }
  }

  function reading() {
    if (sample.kind === 'trichotomy') {
      const x = valueOf(sample)
      const values = { x: numberTex(x), y: numberTex(sample.reference) }
      if (sample.reference === 0) return t(`reading.${signKey(x)}`, values)
      return t(`reading.${x < sample.reference ? 'less' : x > sample.reference ? 'greater' : 'equal'}`, values)
    }
    if (sample.kind === 'transitive') {
      if (shown < transitiveSteps) return ''
      const [a, b, c] = sample.values.map(numberTex)
      return t('reading.transitive', { a, b, c })
    }
    const z = valueOf(sample)
    const [x, y] = sample.values
    if (sample.kind === 'addition') {
      if (phase === 'top') return t('reading.additionTop', { x, y })
      if (phase === 'up') return t('reading.additionUp', { back: numberTex(-z), x, y })
      return t('reading.additionDown', { movedX: numberTex(x + z), movedY: numberTex(y + z), gap: y - x })
    }
    if (z === 0) return t('reading.multiplicationZero')
    const values = { z: numberTex(z), movedX: numberTex(x * z), movedY: numberTex(y * z) }
    return t(z > 0 ? 'reading.multiplicationPositive' : 'reading.multiplicationNegative', values)
  }

  function slider() {
    if (sample.kind === 'transitive') return null
    const { name, min, max, step } = sample.slider
    const value = valueOf(sample)
    const variable = <i className="font-math-italic">{name}</i>
    return (
      <PenSlider
        label={
          <>
            {t('slider')} {variable}
          </>
        }
        ariaLabel={t('aria.slider', { name })}
        valueText={
          <>
            {variable} = {numberLabel(value)}
          </>
        }
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={player.playing}
        onChange={slide}
      />
    )
  }

  function substitution(): { formula: ReactNode; values: string; example: string; footnote: string } {
    const footnote = t('substitution.footnote')
    if (sample.kind === 'trichotomy') {
      const x = numberTex(valueOf(sample))
      const reference = numberTex(sample.reference)
      const relation = relationOf(valueOf(sample), sample.reference)
      const zero = sample.reference === 0
      const formula = zero
        ? `x < 0,\\ x = 0,\\ \\text{${words.or}}\\ x > 0`
        : `x < y,\\ x = y,\\ \\text{${words.or}}\\ x > y`
      return {
        formula: <MathTex tex={formula} />,
        values: zero ? `x = ${x}` : `x = ${x},\\ y = ${reference}`,
        example: `${x} ${relation} ${reference}`,
        footnote,
      }
    }
    if (sample.kind === 'transitive') {
      const [a, b, c] = sample.values.map(numberTex)
      return {
        formula: <MathTex tex={ruleFormula('transitive', words)} />,
        values: `x = ${a},\\ y = ${b},\\ z = ${c}`,
        example: `${a} < ${b}\\ \\text{${words.and}}\\ ${b} < ${c} \\;\\Rightarrow\\; ${a} < ${c}`,
        footnote,
      }
    }
    const z = valueOf(sample)
    const [x, y] = sample.values
    const values = `x = ${x},\\ y = ${y},\\ z = ${numberTex(z)}`
    if (sample.kind === 'addition') {
      return {
        formula: <MathTex tex={ruleFormula('addition', words)} />,
        values,
        example: `${x} < ${y} \\iff ${x} + ${term(z)} < ${y} + ${term(z)}`,
        footnote,
      }
    }
    if (z === 0) {
      return {
        formula: <MathText text={t('substitution.noFormula')} />,
        values,
        example: `(${x})(0) = (${y})(0) = 0`,
        footnote: t('substitution.zeroFootnote'),
      }
    }
    return {
      formula: <MathTex tex={ruleFormula(z > 0 ? 'multiplicationPositive' : 'multiplicationNegative', words)} />,
      values,
      example: `${x} < ${y} \\iff (${x})${factor(z)} ${relationOf(x * z, y * z)} (${y})${factor(z)}`,
      footnote,
    }
  }

  function substitutionCard() {
    const filled = substitution()
    const lines = [
      { key: 'formula', content: filled.formula },
      { key: 'values', content: <MathTex tex={filled.values} /> },
      { key: 'example', content: <MathTex tex={filled.example} /> },
    ] as const
    return (
      <TitledCard title={t('cards.substitution')}>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-3">
          {lines.map((line) => (
            <Fragment key={line.key}>
              <span className="font-hand text-[21px] leading-none text-muted">{t(`substitution.${line.key}`)}</span>
              <span className="min-w-0 overflow-x-auto overflow-y-hidden">{line.content}</span>
            </Fragment>
          ))}
        </div>
        <p className={footnoteClass}>
          <MathText text={filled.footnote} />
        </p>
      </TitledCard>
    )
  }

  function sideCards() {
    if (sample.kind === 'trichotomy') {
      return (
        <TitledCard title={t('cards.signs')}>
          <FormulaList
            items={[
              { key: 'positive', tex: 'x > 0', remark: t('signs.positive') },
              { key: 'negative', tex: 'x < 0', remark: t('signs.negative') },
            ]}
          />
          <p className={footnoteClass}>
            <MathText text={t('signs.footnote')} />
          </p>
        </TitledCard>
      )
    }
    if (sample.kind === 'transitive') {
      const other = sampleKey === 'transitiveA' ? transitiveB : transitiveA
      const [a, b, c] = other.values.map(numberTex)
      return (
        <TitledCard title={t('cards.others')}>
          <FormulaList
            items={[
              {
                key: 'other',
                tex: `${a} < ${b}\\ \\text{${words.and}}\\ ${b} < ${c} \\;\\Rightarrow\\; ${a} < ${c}`,
                remark: t('transitiveOthers.values', { a, b, c }),
              },
            ]}
          />
          <p className={footnoteClass}>{t('transitiveOthers.footnote')}</p>
        </TitledCard>
      )
    }
    if (sample.kind === 'addition') {
      return (
        <TitledCard title={t('cards.twoWays')}>
          <FormulaList items={twoWays.map((item) => ({ key: item.key, tex: item.tex, remark: t(`twoWays.${item.key}`) }))} />
          <p className={footnoteClass}>
            <MathText text={t('twoWays.footnote')} />
          </p>
        </TitledCard>
      )
    }
    return (
      <>
        <TitledCard title={t('cards.others')}>
          <FormulaList
            items={multiplicationOthers.map((item) => ({ key: item.key, tex: item.tex, remark: t(`multiplicationOthers.${item.key}`) }))}
          />
        </TitledCard>
        <TitledCard title={t('cards.trap')}>
          <p data-trap="wrong">
            <span className="relative inline-block after:absolute after:-inset-x-1.5 after:top-[52%] after:-rotate-8 after:border-t-[2.5px] after:border-marker after:content-['']">
              <MathTex tex="-6 < -12" />
            </span>
            <span className="ml-3 font-hand text-[23px] leading-none font-bold text-marker">{t('trap.wrong')}</span>
          </p>
          <p data-trap="right" className="mt-2.5">
            <MathTex tex="-6 > -12" />
            <span className="ml-3 font-hand text-[23px] leading-none font-bold">{t('trap.right')}</span>
          </p>
          <p className={footnoteClass}>
            <MathText text={t('trap.footnote')} />
          </p>
        </TitledCard>
        <TitledCard title={t('cards.ordering')}>
          <p>
            <MathText text={t('ordering.task')} />
          </p>
          <div className="my-3.5 grid gap-1.5">
            {orderingProducts.map((tex) => (
              <span key={tex} className="overflow-x-auto overflow-y-hidden">
                <MathTex tex={tex} />
              </span>
            ))}
          </div>
          {orderingChains.map((tex) => (
            <div key={tex} data-ordering-chain className="overflow-x-auto overflow-y-hidden">
              <MathTex tex={tex} />
            </div>
          ))}
        </TitledCard>
      </>
    )
  }

  function rulesCard() {
    const sign = sample.kind === 'multiplication' ? Math.sign(valueOf(sample)) : null
    const cellClass = 'border-t border-dashed border-faint py-3.5 pr-4 align-top text-[15px] transition-opacity duration-300'
    return (
      <TitledCard title={t('cards.rules')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-hand text-[21px] leading-tight font-bold">
                <th className="pr-4 pb-3 pl-2">{t('rules.property')}</th>
                <th className="pr-4 pb-3">{t('rules.formula')}</th>
              </tr>
            </thead>
            <tbody>
              {ruleRows.map((row) => {
                const ofLaw = row.law === law
                const active = ofLaw && (row.sign === null || row.sign === sign)
                const dim = ofLaw && !active ? 'opacity-45' : ''
                return (
                  <tr key={row.key} data-rule={row.key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                    <th className={`${cellClass} ${dim} pl-2 font-normal whitespace-nowrap`}>
                      <MathText text={t(`rules.names.${row.key}`)} />
                      {isNotedRule(row.key) && (
                        <span className="mt-1 block text-sm whitespace-normal text-muted">{t(`rules.notes.${row.key}`)}</span>
                      )}
                    </th>
                    <td className={`${cellClass} ${dim}`}>
                      <MathTex tex={ruleFormula(row.key, words)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className={footnoteClass}>
          <MathText text={t('rules.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function legendItems(): { key: LegendKey; icon: ReactNode }[] {
    const axis = <line x1={2} x2={42} y1={11} y2={11} strokeWidth={1.6} className="stroke-ink" />
    if (sample.kind === 'trichotomy') {
      return [
        {
          key: sample.reference === 0 ? 'referenceZero' : 'reference',
          icon: (
            <svg viewBox="0 0 44 22" className={legendIconClass}>
              {axis}
              <rect x={16} y={5} width={12} height={12} strokeWidth={2} className="fill-paper stroke-ink" />
            </svg>
          ),
        },
        {
          key: 'point',
          icon: (
            <svg viewBox="0 0 44 22" className={legendIconClass}>
              {axis}
              <circle cx={22} cy={11} r={5} className="fill-ink" />
            </svg>
          ),
        },
        {
          key: 'relation',
          icon: (
            <span className="flex h-5.5 w-11 items-center justify-center">
              <span className="bg-highlight px-2 font-math text-[15px] dark:text-paper">&lt;</span>
            </span>
          ),
        },
      ]
    }
    if (sample.kind === 'transitive') {
      return [
        {
          key: 'arrow',
          icon: (
            <svg viewBox="0 0 44 22" className={legendIconClass}>
              <line x1={4} x2={32} y1={11} y2={11} strokeWidth={2.2} className="stroke-ink" />
              <path d="M40 11 l-10 -5 v10 z" className="fill-ink" />
            </svg>
          ),
        },
        {
          key: 'now',
          icon: (
            <svg viewBox="0 0 44 22" className={legendIconClass}>
              <line x1={4} x2={32} y1={11} y2={11} strokeWidth={3} className="stroke-marker" />
              <path d="M40 11 l-10 -5 v10 z" className="fill-marker" />
            </svg>
          ),
        },
      ]
    }
    const items: { key: LegendKey; icon: ReactNode }[] = [
      {
        key: sample.kind === 'addition' ? 'linkAddition' : 'linkMultiplication',
        icon: (
          <svg viewBox="0 0 44 22" className={legendIconClass}>
            <line x1={22} x2={22} y1={1} y2={12} strokeWidth={1.8} className="stroke-ink" />
            <path d="M22 21 l-5 -10 h10 z" className="fill-ink" />
          </svg>
        ),
      },
      {
        key: 'band',
        icon: (
          <svg viewBox="0 0 44 22" className={legendIconClass}>
            <rect x={10} y={7} width={24} height={8} className="fill-highlight opacity-85" />
            {axis}
          </svg>
        ),
      },
    ]
    if (sample.kind === 'multiplication') {
      items.push({
        key: 'crossed',
        icon: (
          <svg viewBox="0 0 44 22" className={legendIconClass}>
            <line x1={8} y1={2} x2={36} y2={20} strokeWidth={2.4} className="stroke-marker" />
            <line x1={36} y1={2} x2={8} y2={20} strokeWidth={2.4} className="stroke-marker" />
            <circle cx={22} cy={11} r={5} strokeWidth={2} className="fill-none stroke-marker" />
          </svg>
        ),
      })
    }
    return items
  }

  function introKey() {
    if (sample.kind === 'trichotomy') return sample.reference === 0 ? 'trichotomyZero' : 'trichotomyY'
    return sample.kind
  }

  function examplesRow() {
    const keys = lawSamples[law]
    if (keys.length > 1) {
      return keys.map(
        (key, index) =>
          isExampleKey(key) && (
            <TabButton key={key} active={index === exampleIndex} onClick={() => chooseExample(index)}>
              {t(`examples.${key}`)}
            </TabButton>
          ),
      )
    }
    if (sample.kind !== 'addition' && sample.kind !== 'multiplication') return null
    return (
      <span className="text-[15px] text-muted">
        <MathText text={t('given', { x: sample.values[0], y: sample.values[1] })} />
      </span>
    )
  }

  const view = head()
  const idleText = sample.kind === 'transitive' ? tPlayback('idle') : t('idle', { name: sample.slider.name })

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup options={lawKeys.map((key) => ({ value: key, label: t(`laws.${key}`) }))} value={law} onChange={chooseLaw} />
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
          <div data-examples className="flex min-h-10 basis-full flex-wrap items-baseline gap-x-6.5 gap-y-3">
            {examplesRow()}
          </div>
        </>
      }
      board={
        <TitledCard title={t(`laws.${law}`)}>
          <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-2">
            <MathTex tex={view.tex} className="[&_.katex]:text-[1.35em]!" />
            <Stamp tone={view.stamp.kind}>{view.stamp.content}</Stamp>
          </div>
          {figure()}
          {slider()}
          <p data-reading className="mt-2.5 min-h-[1.6em] text-[17px] [&_.katex]:text-[1.15em]!">
            <MathText text={reading()} />
          </p>
        </TitledCard>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={current !== null && <MathText text={captions[current]} />}
          idleText={idleText}
        />
      }
      stage={
        <div className="grid gap-6 sm:grid-cols-2">
          {substitutionCard()}
          {sideCards()}
          {rulesCard()}
        </div>
      }
      detail={
        <NoteCard>
          <p className="mb-3.5">
            <MathText text={t(`intros.${introKey()}`)} />
          </p>
          {(sample.kind === 'addition' || sample.kind === 'multiplication') && (
            <p className="text-muted">
              <MathText text={t(`tips.${sample.kind}`)} />
            </p>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-t border-dashed border-faint pt-3">
            {legendItems().map((item) => (
              <div key={item.key} className="contents">
                <dt>{item.icon}</dt>
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
