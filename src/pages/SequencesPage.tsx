import { Fragment, useState, type ReactNode } from 'react'
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
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { TitledCard } from '../components/molecules/TitledCard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { InequalityStepsTable, type StepTableRow } from '../components/organisms/InequalityStepsTable'
import {
  SequencePlotBoard,
  type PlotLine,
  type PlotLit,
  type PlotRelation,
  type PlotTerm,
  type PlotView,
  type PlotWitness,
  type PlotZone,
} from '../components/organisms/SequencePlotBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import { numberLabel, numberTex } from '../lib/numberLabel'
import {
  firstTermAbove,
  firstTermBelow,
  firstTermEqual,
  fraction,
  fractionDifference,
  fractionLabel,
  fractionTex,
  fractionValue,
  monotoneProperties,
  relationOf,
  relationSymbols,
  termValue,
  type Fraction,
  type MonotoneProperty,
  type Sequence,
} from '../lib/sequence'

type GroupKey = 'notation' | 'monotone' | 'bounded'
type NotationKey = 'finite' | 'even' | 'odd' | 'oneMinus' | 'reciprocalShift' | 'ratioShift' | 'constant' | 'negativeRatio'
type MonotoneKey = 'twoNPlusOne' | 'ratioUp' | 'oneMinusTwoN' | 'ratioDown' | 'stairsUp' | 'stairsDown' | 'alternating' | 'zigzag'
type BoundedKey = 'reciprocal' | 'squareReciprocal' | 'squares' | 'negativeSquares' | 'signs'
type SampleKey = NotationKey | MonotoneKey | BoundedKey
type VariableName = 'n' | 'M' | 'm'
type RuleKey = 'notation' | MonotoneProperty | 'monotone' | 'upper' | 'lower' | 'bounded'
type LegendKey = 'term' | 'shadow' | 'chosen' | 'pair' | 'relation' | 'line' | 'witness' | 'zone'
type Typo = 'firstTerm' | 'thirdTerm' | 'alternating'

type SampleView = PlotView & { decimals: boolean }
type Sample = {
  chip: string
  list: string
  sequence: Sequence
  view: SampleView
  finite?: boolean
  general?: string
  substitute?: (n: number) => string
  zero?: string
  typo?: Typo
  properties?: MonotoneProperty[]
  difference?: string
  sup?: Fraction | null
  inf?: Fraction | null
  slider?: { min: number; max: number; step: number }
  start?: { M: number; m: number }
}

const groupKeys: GroupKey[] = ['notation', 'monotone', 'bounded']
const groupSamples: Record<GroupKey, SampleKey[]> = {
  notation: ['finite', 'even', 'odd', 'oneMinus', 'reciprocalShift', 'ratioShift', 'constant', 'negativeRatio'],
  monotone: ['twoNPlusOne', 'ratioUp', 'oneMinusTwoN', 'ratioDown', 'stairsUp', 'stairsDown', 'alternating', 'zigzag'],
  bounded: ['reciprocal', 'squareReciprocal', 'squares', 'negativeSquares', 'signs'],
}
const groupVariables: Record<GroupKey, VariableName[]> = { notation: ['n'], monotone: ['n'], bounded: ['M', 'm'] }
const groupSteps: Record<GroupKey, number> = { notation: 6, monotone: 6, bounded: 4 }
const termCount = 10
const comparedPairs = 4
const delays = [0.5, 1, 1.5, 2, 3]
const decimalText = '{,}'
const localTexts = ['odd', 'even', 'above', 'below'] as const

const view = (lo: number, hi: number, unit: number, labelStep: number, decimals = false): SampleView => ({ lo, hi, unit, labelStep, decimals })
const sequenceFrom = (start: number, term: (n: number) => Fraction): Sequence => ({ start, term })

const samples: Record<SampleKey, Sample> = {
  finite: {
    chip: '\\{n\\}_{n=1}^{10}',
    list: '\\{n\\}_{n=1}^{10} = 1, 2, 3, \\dots, 10',
    sequence: sequenceFrom(1, (n) => fraction(n)),
    view: view(-1, 11, 1, 2),
    finite: true,
    general: 'n',
  },
  even: {
    chip: '\\{2n\\}',
    list: '\\{2n\\}_{n=1}^{\\infty} = 2, 4, 6, \\dots, 2n, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(2 * n)),
    view: view(0, 21, 1, 4),
    general: '2n',
    substitute: (n) => `2(${n})`,
  },
  odd: {
    chip: '\\{2n-1\\}',
    list: '\\{2n-1\\}_{n=1}^{\\infty} = 1, 3, 5, \\dots, 2n-1, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(2 * n - 1)),
    view: view(0, 21, 1, 4),
    general: '2n-1',
    substitute: (n) => `2(${n}) - 1`,
  },
  oneMinus: {
    chip: '\\{1-n\\}',
    list: '\\{1-n\\}_{n=1}^{\\infty} = 0, -1, -2, \\dots, 1-n, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(1 - n)),
    view: view(-10, 1, 1, 2),
    general: '1-n',
    substitute: (n) => `1 - ${n}`,
  },
  reciprocalShift: {
    chip: '\\{\\tfrac{1}{n-1}\\}_{n=2}^{\\infty}',
    list: '\\left\\{\\tfrac{1}{n-1}\\right\\}_{n=2}^{\\infty} = 1, \\tfrac{1}{2}, \\tfrac{1}{3}, \\dots, \\tfrac{1}{n-1}, \\dots',
    sequence: sequenceFrom(2, (n) => fraction(1, n - 1)),
    view: view(-0.1, 1.1, 0.1, 0.5),
    general: '\\tfrac{1}{n-1}',
    substitute: (n) => `\\tfrac{1}{${n} - 1}`,
    zero: '\\tfrac{1}{1 - 1} = \\tfrac{1}{0}',
  },
  ratioShift: {
    chip: '\\{\\tfrac{n}{n-2}\\}_{n=3}^{\\infty}',
    list: '\\left\\{\\tfrac{n}{n-2}\\right\\}_{n=3}^{\\infty} = 3, 2, \\tfrac{5}{3}, \\dots, \\tfrac{n}{n-2}, \\dots',
    sequence: sequenceFrom(3, (n) => fraction(n, n - 2)),
    view: view(0, 3.5, 0.25, 1),
    general: '\\tfrac{n}{n-2}',
    substitute: (n) => `\\tfrac{${n}}{${n} - 2}`,
    zero: '\\tfrac{2}{2 - 2} = \\tfrac{2}{0}',
  },
  constant: {
    chip: '\\{2\\}',
    list: '\\{2\\}_{n=1}^{\\infty} = 2, 2, 2, \\dots, 2, \\dots',
    sequence: sequenceFrom(1, () => fraction(2)),
    view: view(0, 3, 0.25, 1),
    general: '2',
  },
  negativeRatio: {
    chip: '\\{\\tfrac{n}{2-n}\\}_{n=3}^{\\infty}',
    list: '\\left\\{\\tfrac{n}{2-n}\\right\\}_{n=3}^{\\infty} = -3, -2, -\\tfrac{5}{3}, \\dots, \\tfrac{n}{2-n}, \\dots',
    sequence: sequenceFrom(3, (n) => fraction(n, 2 - n)),
    view: view(-3.5, 0, 0.25, 1),
    general: '\\tfrac{n}{2-n}',
    substitute: (n) => `\\tfrac{${n}}{2 - ${n}}`,
    zero: '\\tfrac{2}{2 - 2} = \\tfrac{2}{0}',
    typo: 'firstTerm',
  },
  twoNPlusOne: {
    chip: '\\{2n+1\\}',
    list: '\\{2n+1\\} = 3, 5, 7, \\dots, 2n+1, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(2 * n + 1)),
    view: view(0, 22, 1, 4),
    properties: ['increasing', 'nonDecreasing'],
    difference: 'a_{n+1} - a_n = (2n+3) - (2n+1) = 2 > 0',
  },
  ratioUp: {
    chip: '\\{\\tfrac{n}{n+1}\\}',
    list: '\\left\\{\\tfrac{n}{n+1}\\right\\} = \\tfrac{1}{2}, \\tfrac{2}{3}, \\tfrac{3}{4}, \\dots, \\tfrac{n}{n+1}, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(n, n + 1)),
    view: view(0, 1.1, 0.1, 0.5),
    properties: ['increasing', 'nonDecreasing'],
    difference: 'a_{n+1} - a_n = \\tfrac{n+1}{n+2} - \\tfrac{n}{n+1} = \\tfrac{1}{(n+1)(n+2)} > 0',
  },
  oneMinusTwoN: {
    chip: '\\{1-2n\\}',
    list: '\\{1-2n\\} = -1, -3, -5, \\dots, 1-2n, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(1 - 2 * n)),
    view: view(-21, 1, 1, 4),
    properties: ['decreasing', 'nonIncreasing'],
    difference: 'a_{n+1} - a_n = (1 - 2(n+1)) - (1 - 2n) = -2 < 0',
    typo: 'thirdTerm',
  },
  ratioDown: {
    chip: '\\{\\tfrac{n+1}{n}\\}',
    list: '\\left\\{\\tfrac{n+1}{n}\\right\\} = 2, \\tfrac{3}{2}, \\tfrac{4}{3}, \\dots, \\tfrac{n+1}{n}, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(n + 1, n)),
    view: view(0.8, 2.2, 0.1, 0.5),
    properties: ['decreasing', 'nonIncreasing'],
    difference: 'a_{n+1} - a_n = \\tfrac{n+2}{n+1} - \\tfrac{n+1}{n} = -\\tfrac{1}{n(n+1)} < 0',
  },
  stairsUp: {
    chip: '1, 1, 2, 2, 3, 3, \\dots',
    list: '1, 1, 2, 2, 3, 3, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(Math.ceil(n / 2))),
    view: view(0, 6, 0.5, 1),
    properties: ['nonDecreasing'],
    difference: 'a_{n+1} - a_n = \\begin{cases} 0, & n \\text{ odd} \\\\ 1, & n \\text{ even} \\end{cases} \\ \\ge 0',
  },
  stairsDown: {
    chip: '1, 1, \\tfrac{1}{2}, \\tfrac{1}{2}, \\dots',
    list: '1, 1, \\tfrac{1}{2}, \\tfrac{1}{2}, \\tfrac{1}{3}, \\tfrac{1}{3}, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(1, Math.ceil(n / 2))),
    view: view(0, 1.2, 0.1, 0.5),
    properties: ['nonIncreasing'],
    difference: 'a_{n+1} - a_n = \\begin{cases} 0, & n \\text{ odd} \\\\ -\\tfrac{1}{k(k+1)}, & n = 2k \\end{cases} \\ \\le 0',
  },
  alternating: {
    chip: '-1, 1, -1, 1, \\dots',
    list: '-1, 1, -1, 1, -1, 1, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(n % 2 ? -1 : 1)),
    view: view(-1.5, 1.5, 0.25, 1),
    properties: [],
    difference: 'a_2 - a_1 = 2 > 0,\\ \\ a_3 - a_2 = -2 < 0',
    typo: 'alternating',
  },
  zigzag: {
    chip: '2, 0, 2, 0, \\dots',
    list: '2, 0, 2, 0, 2, 0, 2, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(n % 2 ? 2 : 0)),
    view: view(-0.5, 2.5, 0.25, 1),
    properties: [],
    difference: 'a_2 - a_1 = -2 < 0,\\ \\ a_3 - a_2 = 2 > 0',
    typo: 'alternating',
  },
  reciprocal: {
    chip: '\\{\\tfrac{1}{n}\\}',
    list: '\\left\\{\\tfrac{1}{n}\\right\\} = 1, \\tfrac{1}{2}, \\tfrac{1}{3}, \\dots, \\tfrac{1}{n}, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(1, n)),
    view: view(-0.25, 1.25, 0.05, 0.25, true),
    sup: fraction(1),
    inf: fraction(0),
    slider: { min: -0.25, max: 1.25, step: 0.05 },
    start: { M: 1.2, m: 0.3 },
  },
  squareReciprocal: {
    chip: '\\{\\tfrac{1}{n^2-1}\\}_{n=2}^{\\infty}',
    list: '\\left\\{\\tfrac{1}{n^2-1}\\right\\}_{n=2}^{\\infty} = \\tfrac{1}{3}, \\tfrac{1}{8}, \\tfrac{1}{15}, \\dots',
    sequence: sequenceFrom(2, (n) => fraction(1, n * n - 1)),
    view: view(-0.1, 0.5, 0.05, 0.1, true),
    sup: fraction(1, 3),
    inf: fraction(0),
    slider: { min: -0.1, max: 0.5, step: 0.05 },
    start: { M: 0.4, m: -0.05 },
  },
  squares: {
    chip: '\\{n^2\\}',
    list: '\\{n^2\\} = 1, 4, 9, \\dots, n^2, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(n * n)),
    view: view(-10, 110, 10, 20),
    sup: null,
    inf: fraction(1),
    slider: { min: -8, max: 99, step: 1 },
    start: { M: 50, m: 0 },
  },
  negativeSquares: {
    chip: '\\{-n^2\\}',
    list: '\\{-n^2\\} = -1, -4, -9, \\dots, -n^2, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(-n * n)),
    view: view(-110, 10, 10, 20),
    sup: fraction(-1),
    inf: null,
    slider: { min: -99, max: 8, step: 1 },
    start: { M: 0, m: -50 },
  },
  signs: {
    chip: '-1, 1, -1, 1, \\dots',
    list: '-1, 1, -1, 1, -1, 1, \\dots',
    sequence: sequenceFrom(1, (n) => fraction(n % 2 ? -1 : 1)),
    view: view(-1.5, 1.5, 0.25, 0.5),
    sup: fraction(1),
    inf: fraction(-1),
    slider: { min: -1.5, max: 1.5, step: 0.25 },
    start: { M: 1.25, m: -0.5 },
  },
}

const propertyTex: Record<MonotoneProperty, string> = {
  increasing: 'a_{n+1} > a_n',
  decreasing: 'a_{n+1} < a_n',
  nonIncreasing: 'a_{n+1} \\le a_n',
  nonDecreasing: 'a_{n+1} \\ge a_n',
}
const finiteFormulas = [
  '\\{n\\}_{n=1}^{10} = 1, 2, 3, \\dots, 10',
  '\\{n\\}_{n=1}^{\\infty} = 1, 2, 3, \\dots, n, \\dots',
  '\\{a_n\\}_{n=1}^{\\infty} = a_1, a_2, a_3, \\dots, a_n, a_{n+1}, \\dots',
]
const classified: { key: string; tex: string; properties: MonotoneProperty[]; bound: string }[] = [
  { key: 'even', tex: '\\{2n\\}', properties: ['increasing'], bound: '\\text{below},\\ m = 2' },
  { key: 'odd', tex: '\\{2n-1\\}', properties: ['increasing'], bound: '\\text{below},\\ m = 1' },
  { key: 'oneMinus', tex: '\\{1-n\\}', properties: ['decreasing'], bound: '\\text{above},\\ M = 0' },
  { key: 'reciprocalShift', tex: '\\{\\tfrac{1}{n-1}\\}_{n=2}^{\\infty}', properties: ['decreasing'], bound: '0 < a_n \\le 1' },
  { key: 'ratioShift', tex: '\\{\\tfrac{n}{n-2}\\}_{n=3}^{\\infty}', properties: ['decreasing'], bound: '1 < a_n \\le 3' },
  { key: 'constant', tex: '\\{2\\}', properties: ['nonIncreasing', 'nonDecreasing'], bound: 'm = M = 2' },
  { key: 'negativeRatio', tex: '\\{\\tfrac{n}{2-n}\\}_{n=3}^{\\infty}', properties: ['increasing'], bound: '-3 \\le a_n < -1' },
]
const ruleKeys: RuleKey[] = ['notation', ...monotoneProperties, 'monotone', 'upper', 'lower', 'bounded']
const legendKeys: Record<GroupKey, LegendKey[]> = {
  notation: ['term', 'shadow', 'chosen'],
  monotone: ['term', 'shadow', 'pair', 'relation'],
  bounded: ['term', 'shadow', 'line', 'witness', 'zone'],
}
const footnoteClass = 'mt-4.5 text-[15px] text-muted'
const cellClass = 'border-t border-dashed border-faint py-2.5 pr-4 align-middle text-[15px]'
const headClass = 'font-hand text-[21px] leading-tight font-bold'

function decimalParts(value: number) {
  const digits = Math.abs(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  return { negative: value < -1e-9, digits }
}

const lastOf = (sample: Sample) => sample.sequence.start + termCount - 1
const termTex = (sample: Sample, n: number) => {
  const result = fractionTex(sample.sequence.term(n))
  return sample.substitute ? `a_{${n}} = ${sample.substitute(n)} = ${result}` : `a_{${n}} = ${result}`
}

export function SequencesPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.sequences' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('sequences')
  const [group, setGroup] = useState<GroupKey>('notation')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [values, setValues] = useState<Partial<Record<string, number>>>({})
  const [delay, setDelay] = useState(1.5)

  const sampleKey = groupSamples[group][exampleIndex]
  const sample = samples[sampleKey]
  const sequence = sample.sequence
  const total = groupSteps[group]
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const reached = (index: number) => current === null || current >= index

  function localize(tex: string) {
    let out = tex.replaceAll(decimalText, t('words.decimal'))
    for (const word of localTexts) out = out.replaceAll(`\\text{ ${word}}`, `\\text{ ${t(`words.${word}`)}}`).replaceAll(`\\text{${word}}`, `\\text{${t(`words.${word}`)}}`)
    return out
  }

  function sliderRange() {
    if (group === 'notation') return { min: sequence.start, max: lastOf(sample), step: 1 }
    if (group === 'monotone') return { min: 1, max: termCount - 1, step: 1 }
    return sample.slider ?? { min: 0, max: 1, step: 1 }
  }

  function initialOf(name: VariableName) {
    if (name === 'n') return group === 'notation' ? sequence.start + 3 : 4
    return sample.start?.[name] ?? 0
  }

  const valueOf = (name: VariableName) => values[`${sampleKey}.${name}`] ?? initialOf(name)

  function labelOf(value: number) {
    if (!sample.view.decimals) return numberLabel(value)
    const { negative, digits } = decimalParts(value)
    return `${negative ? '−' : ''}${digits.replace('.', t('words.decimalMark'))}`
  }

  function texOf(value: number) {
    if (!sample.view.decimals) return numberTex(value)
    const { negative, digits } = decimalParts(value)
    return `${negative ? '-' : ''}${digits.replace('.', t('words.decimal'))}`
  }

  const sliderText = (name: VariableName) => (name === 'n' ? String(valueOf(name)) : labelOf(valueOf(name)))
  const propertyNames = (properties: MonotoneProperty[]) => properties.map((property) => t(`properties.${property}`))

  function chooseGroup(next: GroupKey) {
    player.stop()
    setExampleIndex(0)
    setGroup(next)
  }

  function chooseExample(index: number) {
    player.stop()
    setExampleIndex(index)
  }

  function move(name: VariableName, next: number) {
    setValues((previous) => ({ ...previous, [`${sampleKey}.${name}`]: next }))
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    player.start()
  }

  function plotTerms(shown: (n: number) => boolean): PlotTerm[] {
    return Array.from({ length: termCount }, (_, index) => {
      const n = sequence.start + index
      return { n, value: termValue(sequence, n), label: fractionLabel(sequence.term(n)), shown: shown(n) }
    })
  }

  const emptyFigure = {
    valueLabels: false,
    chosen: null as number | null,
    path: false,
    pair: null as number | null,
    relations: [] as PlotRelation[],
    lines: [] as PlotLine[],
    witnesses: [] as PlotWitness[],
    zones: [] as PlotZone[],
    litValues: [] as PlotLit[],
  }

  function notationView() {
    const playing = current !== null && current < 5
    const chosen = playing ? sequence.start + (current ?? 0) : valueOf('n')
    const shown = (n: number) => current === null || current >= 5 || n <= sequence.start + current
    const position = chosen - sequence.start + 1
    const rows: StepTableRow[] = [0, 1, 2, 3, 4].map((offset) => {
      const n = sequence.start + offset
      return {
        key: `term${offset}`,
        tex: `n = ${n}:\\ ${termTex(sample, n)}`,
        reason: t('reasons.term', { position: offset + 1 }),
        flip: false,
        testTex: '',
        holds: true,
        visible: reached(offset),
        now: current === offset,
      }
    })
    const starts = [0, 1, 2].map((offset) => sequence.start + offset).join(', ')
    rows.push({
      key: 'general',
      tex: sample.finite ? 'a_n = n,\\ n = 1, 2, \\dots, 10' : `a_n = ${sample.general},\\ n = ${starts}, \\dots`,
      reason: t(sample.finite ? 'reasons.finite' : 'reasons.infinite'),
      flip: false,
      testTex: '',
      holds: true,
      visible: reached(5),
      now: current === 5,
    })
    const chosenValue = termValue(sequence, chosen)
    return {
      equation: <MathTex tex={sample.list} className="text-[1.35em]" />,
      rows,
      verdicts: null,
      figure: {
        ...emptyFigure,
        terms: plotTerms(shown),
        valueLabels: true,
        chosen,
        litValues: shown(chosen) ? [{ value: chosenValue, label: fractionLabel(sequence.term(chosen)) }] : [],
      },
      captions: [
        ...[0, 1, 2, 3, 4].map((offset) =>
          t('steps.substitute', { n: sequence.start + offset, term: termTex(sample, sequence.start + offset), position: offset + 1 }),
        ),
        sample.finite ? t('steps.finite') : t('steps.general', { general: sample.general }),
      ],
      reading: t('reading.term', { n: chosen, position, term: `a_{${chosen}} = ${fractionTex(sequence.term(chosen))}` }),
    }
  }

  function comparison(n: number) {
    const a = sequence.term(n)
    const b = sequence.term(n + 1)
    const relation = relationOf(fractionValue(a), fractionValue(b))
    const symbol = relation === 'less' ? '>' : relation === 'greater' ? '<' : '='
    return { a, b, relation, nextTex: `a_{${n + 1}} ${symbol} a_{${n}}`, valuesTex: `${fractionTex(b)} ${symbol} ${fractionTex(a)}` }
  }

  function monotoneView() {
    const properties = sample.properties ?? []
    const pairsShown = current === null || current >= 5 ? termCount - 1 : current
    const pair = current === null || current >= 5 ? valueOf('n') : current >= 1 ? current : null
    const rows: StepTableRow[] = Array.from({ length: comparedPairs }, (_, index) => {
      const n = index + 1
      const { a, b, nextTex } = comparison(n)
      return {
        key: `pair${n}`,
        tex: `a_{${n}} = ${fractionTex(a)},\\ a_{${n + 1}} = ${fractionTex(b)}`,
        reason: t('reasons.difference', { difference: `a_{${n + 1}} - a_{${n}} = ${fractionTex(fractionDifference(b, a))}` }),
        flip: false,
        testTex: nextTex,
        holds: true,
        visible: reached(n),
        now: current === n,
      }
    })
    const relations: PlotRelation[] = Array.from({ length: termCount - 1 }, (_, index) => index + 1)
      .filter((n) => n <= pairsShown)
      .map((n) => ({ n, symbol: relationSymbols[relationOf(termValue(sequence, n), termValue(sequence, n + 1))], now: n === pair }))
    const stamps = !reached(5) ? (
      <Stamp tone="pending">{t('stamps.monotonePending')}</Stamp>
    ) : properties.length > 0 ? (
      propertyNames(properties).map((name) => (
        <Stamp key={name} tone="yes">
          {name}
        </Stamp>
      ))
    ) : (
      <Stamp tone="flip">{t('stamps.notMonotone')}</Stamp>
    )
    const readingPair = pair ?? 1
    const read = comparison(readingPair)
    return {
      equation: (
        <>
          <MathTex tex={sample.list} className="text-[1.35em]" />
          {stamps}
        </>
      ),
      rows,
      verdicts: null,
      figure: { ...emptyFigure, terms: plotTerms(() => true), valueLabels: true, path: true, pair, relations },
      captions: [
        t('steps.plotted'),
        ...rows.map((_, index) => {
          const { valuesTex } = comparison(index + 1)
          return t('steps.compare', { next: `a_{${index + 2}}`, current: `a_{${index + 1}}`, relation: valuesTex })
        }),
        properties.length > 0 ? t('steps.monotone', { properties: propertyNames(properties).join(` ${t('words.and')} `) }) : t('steps.notMonotone'),
      ],
      reading: t('reading.pair', {
        current: `a_{${readingPair}} = ${fractionTex(read.a)}`,
        next: `a_{${readingPair + 1}} = ${fractionTex(read.b)}`,
        word: t(`reading.${read.relation}`),
      }),
    }
  }

  function boundedView() {
    const M = valueOf('M')
    const m = valueOf('m')
    const above = firstTermAbove(sequence, M)
    const below = firstTermBelow(sequence, m)
    const MTex = texOf(M)
    const mTex = texOf(m)
    const sup = sample.sup ?? null
    const inf = sample.inf ?? null
    const termAt = (n: number) => `a_{${n}} = ${fractionTex(sequence.term(n))}`
    const rows: StepTableRow[] = [
      {
        key: 'upper',
        tex: `M = ${MTex}:\\ a_n \\le M,\\ \\forall n`,
        reason: above ? t('reasons.upperFails', { term: termAt(above) }) : t('reasons.upperHolds'),
        flip: above !== null,
        testTex: '',
        holds: above === null,
        visible: reached(1),
        now: current === 1,
      },
      {
        key: 'lower',
        tex: `m = ${mTex}:\\ a_n \\ge m,\\ \\forall n`,
        reason: below ? t('reasons.lowerFails', { term: termAt(below) }) : t('reasons.lowerHolds'),
        flip: below !== null,
        testTex: '',
        holds: below === null,
        visible: reached(2),
        now: current === 2,
      },
    ]
    const lines: PlotLine[] = []
    const witnesses: PlotWitness[] = []
    if (reached(1)) {
      lines.push({ side: 'upper', name: 'M', value: M })
      if (above) witnesses.push({ side: 'upper', n: above, value: termValue(sequence, above), label: fractionLabel(sequence.term(above)) })
    }
    if (reached(2)) {
      lines.push({ side: 'lower', name: 'm', value: m })
      if (below) witnesses.push({ side: 'lower', n: below, value: termValue(sequence, below), label: fractionLabel(sequence.term(below)) })
    }
    const zones: PlotZone[] = reached(3)
      ? [
          { side: 'upper', value: sup && fractionValue(sup), noneText: t('zones.noUpper') },
          { side: 'lower', value: inf && fractionValue(inf), noneText: t('zones.noLower') },
        ]
      : []
    const litValues: PlotLit[] = reached(3)
      ? [sup, inf].filter((bound): bound is Fraction => bound !== null).map((bound) => ({ value: fractionValue(bound), label: fractionLabel(bound) }))
      : []
    const stamp = !reached(3) ? (
      <Stamp tone="pending">{t('stamps.boundedPending')}</Stamp>
    ) : sup && inf ? (
      <Stamp tone="yes">{t('stamps.bounded')}</Stamp>
    ) : (
      <Stamp tone="flip">{t(inf ? 'stamps.belowOnly' : 'stamps.aboveOnly')}</Stamp>
    )
    return {
      equation: (
        <>
          <MathTex tex={sample.list} className="text-[1.35em]" />
          {stamp}
        </>
      ),
      rows,
      verdicts: { holds: t('table.holds'), fails: t('table.fails') },
      figure: { ...emptyFigure, terms: plotTerms(() => true), lines, witnesses, zones, litValues },
      captions: [
        t('steps.plotted'),
        above ? t('steps.upperFails', { M: MTex, term: `a_{${above}}` }) : t('steps.upperHolds', { M: MTex }),
        below ? t('steps.lowerFails', { m: mTex, term: `a_{${below}}` }) : t('steps.lowerHolds', { m: mTex }),
        t('steps.all', {
          upper: sup ? t('steps.everyUpper', { value: fractionTex(sup) }) : t('steps.noUpper'),
          lower: inf ? t('steps.everyLower', { value: fractionTex(inf) }) : t('steps.noLower'),
        }),
      ],
      reading: t('reading.joined', {
        first: t(above ? 'reading.upperFails' : 'reading.upperHolds', { M: MTex }),
        second: t(below ? 'reading.lowerFails' : 'reading.lowerHolds', { m: mTex }),
      }),
    }
  }

  const boardView = group === 'notation' ? notationView() : group === 'monotone' ? monotoneView() : boundedView()

  function formulaCard() {
    const n = valueOf('n')
    const position = n - sequence.start + 1
    const items = [
      { key: 'general', tex: `a_n = ${sample.general}`, remark: t('formula.general', { start: sequence.start }) },
      {
        key: 'chosen',
        tex: `n = ${n}:\\ ${termTex(sample, n)}`,
        remark: t(sample.substitute || sample.finite ? 'formula.position' : 'formula.constant', { position }),
      },
    ]
    if (sample.zero) items.push({ key: 'zero', tex: `n = ${sequence.start - 1}:\\ ${sample.zero}`, remark: t('formula.zero', { start: sequence.start }) })
    return (
      <TitledCard title={t('cards.formula')}>
        <FormulaList items={items} />
        {sample.typo === 'firstTerm' && (
          <p className={footnoteClass}>
            <MathText text={t('formula.typo')} />
          </p>
        )}
      </TitledCard>
    )
  }

  function finiteCard() {
    const remarks = t('finite.remarks', { returnObjects: true }) as string[]
    return (
      <TitledCard title={t('cards.finite')}>
        <FormulaList items={finiteFormulas.map((tex, index) => ({ key: tex, tex, remark: remarks[index] }))} />
      </TitledCard>
    )
  }

  function allNCard() {
    const properties = sample.properties ?? []
    const remark = properties.length > 0 ? t('allN.holds', { properties: propertyNames(properties).join(` ${t('words.and')} `) }) : t('allN.mixed')
    return (
      <TitledCard title={t('cards.allN')}>
        <FormulaList items={[{ key: 'difference', tex: localize(sample.difference ?? ''), remark }]} />
        <p className={footnoteClass}>
          <MathText text={t('allN.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function fourCard() {
    const properties = sample.properties ?? []
    const notes = [t('four.footnote')]
    if (sample.typo === 'thirdTerm') notes.push(t('four.typoThird'))
    if (sample.typo === 'alternating') notes.push(t('four.typoAlternating'))
    return (
      <TitledCard title={t('cards.four')}>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <tbody>
              {monotoneProperties.map((property) => {
                const holds = properties.includes(property)
                return (
                  <tr key={property} data-property={property} data-holds={holds} className={holds ? 'bg-highlight-soft' : ''}>
                    <td className={`${cellClass} pl-2 whitespace-nowrap`}>{t(`properties.${property}`)}</td>
                    <td className={cellClass}>
                      <MathTex tex={`${propertyTex[property]},\\ \\forall n`} />
                    </td>
                    <td className={`${cellClass} font-hand text-[21px]! leading-none font-bold ${holds ? '' : 'text-faint'}`}>
                      {t(holds ? 'four.yes' : 'four.no')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {notes.map((note) => (
          <p key={note} className={footnoteClass}>
            <MathText text={note} />
          </p>
        ))}
      </TitledCard>
    )
  }

  function bestCard() {
    const cell = (of: Sample, bound: Fraction | null | undefined, kind: 'sup' | 'inf') => {
      if (!bound) {
        return (
          <td data-bound={kind} data-value="none" className={cellClass}>
            <span className="text-muted">{t('words.none')}</span>
          </td>
        )
      }
      const n = firstTermEqual(of.sequence, fractionValue(bound))
      return (
        <td data-bound={kind} data-value={fractionValue(bound)} data-reached={n ?? 'never'} className={cellClass}>
          <MathTex tex={fractionTex(bound)} />
          <span className="block text-sm text-muted">{n ? <MathTex tex={`= a_{${n}}`} /> : t('best.never')}</span>
        </td>
      )
    }
    return (
      <TitledCard title={t('cards.best')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className={headClass}>
                <th className="pr-4 pb-2 pl-2">{t('best.sequence')}</th>
                <th className="pr-4 pb-2">
                  <MathText text={t('best.least')} />
                </th>
                <th className="pr-4 pb-2">
                  <MathText text={t('best.greatest')} />
                </th>
              </tr>
            </thead>
            <tbody>
              {groupSamples.bounded.map((key) => {
                const of = samples[key]
                const active = key === sampleKey
                return (
                  <tr key={key} data-best={key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                    <td className={`${cellClass} pl-2`}>
                      <MathTex tex={of.chip} />
                    </td>
                    {cell(of, of.sup, 'sup')}
                    {cell(of, of.inf, 'inf')}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className={footnoteClass}>
          <MathText text={t('best.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function othersCard() {
    return (
      <TitledCard title={t('cards.others')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className={headClass}>
                <th className="pr-4 pb-2 pl-2">{t('others.sequence')}</th>
                <th className="pr-4 pb-2">{t('others.monotone')}</th>
                <th className="pr-4 pb-2">{t('others.bounded')}</th>
              </tr>
            </thead>
            <tbody>
              {classified.map((row) => (
                <tr key={row.key} data-classified={row.key}>
                  <td className={`${cellClass} pl-2`}>
                    <MathTex tex={row.tex} />
                  </td>
                  <td className={cellClass}>{propertyNames(row.properties).join(', ')}</td>
                  <td className={cellClass}>
                    <MathTex tex={localize(row.bound)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={footnoteClass}>{t('others.footnote')}</p>
      </TitledCard>
    )
  }

  function ruleActive(key: RuleKey) {
    if (key === 'notation') return group === 'notation'
    if (group === 'monotone') {
      const properties = sample.properties ?? []
      if (key === 'monotone') return properties.length > 0
      return properties.includes(key as MonotoneProperty)
    }
    if (group !== 'bounded') return false
    if (key === 'upper') return Boolean(sample.sup)
    if (key === 'lower') return Boolean(sample.inf)
    if (key === 'bounded') return Boolean(sample.sup && sample.inf)
    return false
  }

  function rulesCard() {
    return (
      <TitledCard title={t('cards.rules')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className={headClass}>
                <th className="pr-4 pb-3 pl-2">{t('rules.name')}</th>
                <th className="pr-4 pb-3">{t('rules.formula')}</th>
              </tr>
            </thead>
            <tbody>
              {ruleKeys.map((key) => {
                const active = ruleActive(key)
                return (
                  <tr key={key} data-rule={key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                    <th className={`${cellClass} pl-2 font-normal whitespace-nowrap`}>{t(`rules.names.${key}`)}</th>
                    <td className={cellClass}>
                      <MathTex tex={t(`rules.formulas.${key}`)} />
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

  function groupCards() {
    if (group === 'notation') return [formulaCard(), finiteCard()]
    if (group === 'monotone') return [allNCard(), fourCard()]
    return [bestCard(), othersCard()]
  }

  const legendIcons: Record<LegendKey, ReactNode> = {
    term: <circle cx={22} cy={11} r={5} className="fill-ink" />,
    shadow: (
      <>
        <line x1={22} x2={22} y1={2} y2={20} strokeWidth={1.6} className="stroke-ink" />
        <circle cx={22} cy={11} r={3} className="fill-ink opacity-45" />
      </>
    ),
    chosen: (
      <>
        <circle cx={22} cy={11} r={5} className="fill-ink" />
        <circle cx={22} cy={11} r={9} strokeWidth={2.4} className="fill-none stroke-marker" />
      </>
    ),
    pair: <line x1={8} x2={36} y1={16} y2={6} strokeWidth={3} className="stroke-marker" />,
    relation: (
      <text x={22} y={17} textAnchor="middle" className="fill-ink font-math text-[18px]">
        {'<'}
      </text>
    ),
    line: <line x1={2} x2={42} y1={11} y2={11} strokeWidth={1.8} strokeDasharray="7 5" className="stroke-ink" />,
    witness: <circle cx={22} cy={11} r={8} strokeWidth={2.6} className="fill-none stroke-marker" />,
    zone: (
      <>
        <rect x={2} y={2} width={40} height={18} className="fill-highlight opacity-30" />
        <line x1={2} x2={42} y1={20} y2={20} strokeWidth={2.2} className="stroke-ink" />
      </>
    ),
  }

  const variables = groupVariables[group]
  const figure = boardView.figure

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
          <PlayButton playing={player.playing} startLabel={tPlayback('start')} stopLabel={tPlayback('stop')} onClick={togglePlayback} />
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
          <div data-equation className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {boardView.equation}
          </div>
          <SequencePlotBoard
            view={sample.view}
            terms={figure.terms}
            finite={Boolean(sample.finite)}
            valueLabels={figure.valueLabels}
            chosen={figure.chosen}
            path={figure.path}
            pair={figure.pair}
            relations={figure.relations}
            relationTitle={t('relationTitle')}
            lines={figure.lines}
            witnesses={figure.witnesses}
            zones={figure.zones}
            litValues={figure.litValues}
            axisLabel={labelOf}
            ariaLabel={t('aria.plot')}
          />
          {variables.map((name) => {
            const variable = <i className="font-math-italic">{name}</i>
            const range = sliderRange()
            return (
              <PenSlider
                key={name}
                label={
                  <>
                    {t('slider')} {variable}
                  </>
                }
                ariaLabel={t(`aria.slider.${name}`)}
                valueText={
                  <>
                    {variable} = {sliderText(name)}
                  </>
                }
                min={range.min}
                max={range.max}
                step={range.step}
                value={valueOf(name)}
                disabled={false}
                onChange={(next) => move(name, next)}
              />
            )
          })}
          <div className="mt-3">
            <InequalityStepsTable
              rows={boardView.rows}
              stepHeader={t('table.step')}
              testHeader={group === 'monotone' ? t('table.compare') : ''}
              verdicts={boardView.verdicts}
            />
          </div>
          <p data-reading className="mt-2.5 min-h-[1.6em] text-[17px] [&_.katex]:text-[1.15em]!">
            <MathText text={boardView.reading} />
          </p>
        </TitledCard>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={current !== null && <MathText text={boardView.captions[current]} />}
          idleText={t(group === 'bounded' ? 'idle.bounds' : 'idle.n')}
        />
      }
      stage={
        <div className="grid gap-6 sm:grid-cols-2">
          {groupCards().map((card, index) => (
            <Fragment key={index}>{card}</Fragment>
          ))}
          {rulesCard()}
        </div>
      }
      detail={
        <NoteCard>
          <p className="mb-3.5">
            <MathText text={t(`intros.${group}`)} />
          </p>
          <p className="text-muted">
            <MathText text={t(`tips.${group}`)} />
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-t border-dashed border-faint pt-3">
            {legendKeys[group].map((key) => (
              <div key={key} className="contents">
                <dt>
                  <svg viewBox="0 0 44 22" className="block h-5.5 w-11">
                    {legendIcons[key]}
                  </svg>
                </dt>
                <dd className="text-muted">
                  <MathText text={t(`legend.${key}`)} />
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
