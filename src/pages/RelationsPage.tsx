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
import { SetItemsList } from '../components/molecules/SetItemsList'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { TitledCard } from '../components/molecules/TitledCard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { InequalityStepsTable, type StepTableRow } from '../components/organisms/InequalityStepsTable'
import {
  RelationArrowGridBoard,
  type RelationMember,
  type RelationPair,
  type RelationSet,
} from '../components/organisms/RelationArrowGridBoard'
import {
  RelationPlaneBoard,
  type PlaneBand,
  type PlaneNote,
  type PlaneProbe,
  type PlaneRegion,
  type PlaneVertical,
} from '../components/organisms/RelationPlaneBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import { numberLabel } from '../lib/numberLabel'
import {
  groupedTex,
  inView,
  near,
  pairsWhere,
  range,
  setTex,
  uniqueSorted,
  valueTex,
  type Coordinate,
  type PlaneView,
} from '../lib/relation'

type GroupKey = 'meaning' | 'rule' | 'domain'
type MeaningKey = 'hobby' | 'older' | 'less' | 'greater' | 'all' | 'letters'
type RuleSampleKey = 'greaterNatural' | 'evenSum' | 'negative' | 'nonnegative' | 'one'
type DomainKey = 'sqrt' | 'triple' | 'positive'
type SampleKey = MeaningKey | RuleSampleKey | DomainKey
type MemberSource = 'children' | 'sports' | 'siblings' | 'odd' | 'even' | 'letters' | 'small'
type FormulaKey = 'relates' | 'negation' | 'setOf' | 'subset' | 'universal' | 'domain' | 'codomain'
type LegendKey = 'arrow' | 'arrowNow' | 'member' | 'miss' | 'lattice' | 'region' | 'probe' | 'shadow' | 'probeLine' | 'open' | 'not'
type SliderRange = { min: number; max: number; step: number }
type TestKind = 'compare' | 'parity' | 'product'
type RegionKind = 'negative' | 'nonnegative' | 'one'

type MeaningSample = {
  first: { name: string; source: MemberSource }
  second: { name: string; source: MemberSource }
  universal: boolean
  holds: (i: number, j: number, a: RelationMember, b: RelationMember) => boolean
}

type RuleSample = {
  set: string
  vars: [string, string]
  member: ((value: number) => boolean) | null
  region: RegionKind | null
  view: PlaneView
  sliders: [SliderRange, SliderRange]
  start: Coordinate
  ruleTex: string
  cond: string
  holds: (x: number, y: number) => boolean
  test: TestKind
  expression: (x: number, y: number) => string
  pairs: Coordinate[]
}

type DomainLattice = {
  memberX: (value: number) => boolean
  memberY: (value: number) => boolean
  partners: (a: number) => number[]
  pairs: Coordinate[]
  pairTex: (a: number, b: number) => string
  litX: number[]
  litY: number[]
}

type DomainSample = {
  view: PlaneView
  slider: SliderRange
  start: number
  universal: boolean
  ruleTex: string
  given: string
  firstTex: string
  secondTex: string
  domainTex: string
  codomainTex: string
  lattice: DomainLattice | null
}

type MeaningEntry = { i: number; j: number; a: RelationMember; b: RelationMember; holds: boolean }

const Rel = '\\mathrel{\\mathrm R}'
const Dom = 'D(\\mathrm R)'
const Cod = '\\mathit{R}(\\mathrm R)'
const delays = [0.5, 1, 1.5, 2, 3]
const groupKeys: GroupKey[] = ['meaning', 'rule', 'domain']
const meaningKeys: MeaningKey[] = ['hobby', 'older', 'less', 'greater', 'all', 'letters']
const ruleSampleKeys: RuleSampleKey[] = ['greaterNatural', 'evenSum', 'negative', 'nonnegative', 'one']
const domainKeys: DomainKey[] = ['sqrt', 'triple', 'positive']
const groupSamples: Record<GroupKey, SampleKey[]> = { meaning: meaningKeys, rule: ruleSampleKeys, domain: domainKeys }
const formulaKeys: FormulaKey[] = ['relates', 'negation', 'setOf', 'subset', 'universal', 'domain', 'codomain']
const legendKeys: Record<GroupKey, LegendKey[]> = {
  meaning: ['arrow', 'arrowNow', 'member', 'miss', 'not'],
  rule: ['member', 'lattice', 'region', 'probe', 'not'],
  domain: ['member', 'shadow', 'probeLine', 'open', 'not'],
}
const childNames = ['Nana', 'Nani', 'Nina', 'Nini']
const footnoteClass = 'mt-3 text-sm text-muted'
const cellClass = 'border-t border-dashed border-faint py-2 pr-3 pl-1.5 align-middle'

const natural = (value: number) => Number.isInteger(value) && value >= 1
const integer = (value: number) => Number.isInteger(value)
const listed = (pairs: Coordinate[]) => (i: number, j: number) => pairs.some(([a, b]) => a === i && b === j)
const realSlider: SliderRange = { min: -4, max: 4, step: 0.5 }
const realView: PlaneView = { x: [-4, 4], y: [-4, 4], width: 280, xStep: 1, yStep: 1 }
const productExpression = (x: number, y: number) => `${groupedTex(x)} \\cdot ${groupedTex(y)} = ${valueTex(x * y)}`

const meaningSamples: Record<MeaningKey, MeaningSample> = {
  hobby: {
    first: { name: 'A', source: 'children' },
    second: { name: 'O', source: 'sports' },
    universal: false,
    holds: listed([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 1],
      [3, 2],
    ]),
  },
  older: { first: { name: 'K', source: 'siblings' }, second: { name: 'K', source: 'siblings' }, universal: true, holds: (i, j) => i < j },
  less: { first: { name: 'B', source: 'odd' }, second: { name: 'C', source: 'even' }, universal: false, holds: (_i, _j, a, b) => (a.value ?? 0) < (b.value ?? 0) },
  greater: { first: { name: 'B', source: 'odd' }, second: { name: 'C', source: 'even' }, universal: false, holds: (_i, _j, a, b) => (a.value ?? 0) > (b.value ?? 0) },
  all: { first: { name: 'B', source: 'odd' }, second: { name: 'C', source: 'even' }, universal: false, holds: () => true },
  letters: {
    first: { name: 'A', source: 'letters' },
    second: { name: 'N', source: 'small' },
    universal: false,
    holds: listed([
      [0, 0],
      [1, 1],
      [2, 0],
    ]),
  },
}

const ruleSamples: Record<RuleSampleKey, RuleSample> = {
  greaterNatural: {
    set: '\\mathbb N',
    vars: ['m', 'n'],
    member: natural,
    region: null,
    view: { x: [0, 10], y: [0, 10], width: 280, xStep: 1, yStep: 1 },
    sliders: [
      { min: 1, max: 10, step: 1 },
      { min: 1, max: 10, step: 1 },
    ],
    start: [4, 7],
    ruleTex: `m ${Rel} n \\iff m > n`,
    cond: 'm > n',
    holds: (m, n) => m > n,
    test: 'compare',
    expression: (m, n) => `${m} > ${n}`,
    pairs: [
      [3, 2],
      [1, 2],
      [7, 4],
      [5, 9],
      [20, 10],
      [20, 50],
    ],
  },
  evenSum: {
    set: '\\mathbb Z',
    vars: ['m', 'n'],
    member: integer,
    region: null,
    view: { x: [-4, 8], y: [-2, 10], width: 280, xStep: 2, yStep: 2 },
    sliders: [
      { min: -4, max: 8, step: 1 },
      { min: -2, max: 10, step: 1 },
    ],
    start: [3, 6],
    ruleTex: `m ${Rel} n \\iff m + n \\text{ even}`,
    cond: 'm + n \\text{ even}',
    holds: (m, n) => Math.abs(m + n) % 2 === 0,
    test: 'parity',
    expression: (m, n) => `${groupedTex(m)} + ${groupedTex(n)} = ${valueTex(m + n)}`,
    pairs: [
      [2, 8],
      [-2, 7],
      [13, 15],
      [5, 10],
      [-13, 15],
      [15, 10],
    ],
  },
  negative: {
    set: '\\mathbb R',
    vars: ['x', 'y'],
    member: null,
    region: 'negative',
    view: realView,
    sliders: [realSlider, realSlider],
    start: [2, 1],
    ruleTex: `x ${Rel} y \\iff xy < 0`,
    cond: 'xy < 0',
    holds: (x, y) => x * y < -1e-9,
    test: 'product',
    expression: productExpression,
    pairs: [
      [2, -3],
      [-1, -2],
      [0, 3],
    ],
  },
  nonnegative: {
    set: '\\mathbb R',
    vars: ['x', 'y'],
    member: null,
    region: 'nonnegative',
    view: realView,
    sliders: [realSlider, realSlider],
    start: [2, -1],
    ruleTex: `x ${Rel} y \\iff xy \\ge 0`,
    cond: 'xy \\ge 0',
    holds: (x, y) => x * y > -1e-9,
    test: 'product',
    expression: productExpression,
    pairs: [
      [2, 3],
      [-2, -1],
      [3, -1],
      [0, -4],
    ],
  },
  one: {
    set: '\\mathbb R',
    vars: ['x', 'y'],
    member: null,
    region: 'one',
    view: realView,
    sliders: [realSlider, realSlider],
    start: [2, 2],
    ruleTex: `x ${Rel} y \\iff xy = 1`,
    cond: 'xy = 1',
    holds: (x, y) => near(x * y, 1),
    test: 'product',
    expression: productExpression,
    pairs: [
      [2, 0.5],
      [-3, -1 / 3],
      [2, 2],
      [0.5, 2],
    ],
  },
}

const domainSamples: Record<DomainKey, DomainSample> = {
  sqrt: {
    view: { x: [0, 20], y: [0, 10], width: 560, xStep: 1, yStep: 1 },
    slider: { min: 1, max: 20, step: 1 },
    start: 5,
    universal: false,
    ruleTex: `a ${Rel} b \\iff \\sqrt a = b`,
    given: 'A = \\{1, 2, \\dots, 20\\},\\ B = \\{1, 2, \\dots, 10\\}',
    firstTex: 'A = \\{1, 2, 3, \\dots, 20\\}',
    secondTex: 'B = \\{1, 2, 3, \\dots, 10\\}',
    domainTex: '\\{1, 4, 9, 16\\}',
    codomainTex: '\\{1, 2, 3, 4\\}',
    lattice: {
      memberX: (value) => value >= 1 && value <= 20,
      memberY: (value) => value >= 1 && value <= 10,
      partners: (a) => {
        const root = Math.round(Math.sqrt(a))
        return root * root === a && root <= 10 ? [root] : []
      },
      pairs: [
        [1, 1],
        [4, 2],
        [9, 3],
        [16, 4],
      ],
      pairTex: (a, b) => `a = ${a}:\\ \\sqrt{${a}} = ${b}`,
      litX: [1, 4, 9, 16],
      litY: [1, 2, 3, 4],
    },
  },
  triple: {
    view: { x: [-4, 4], y: [-12, 12], width: 280, xStep: 1, yStep: 3 },
    slider: { min: -4, max: 4, step: 1 },
    start: 2,
    universal: true,
    ruleTex: `a ${Rel} b \\iff b = 3a`,
    given: 'a, b \\in \\mathbb Z',
    firstTex: 'A = \\mathbb Z',
    secondTex: 'B = \\mathbb Z',
    domainTex: '\\mathbb Z',
    codomainTex: '\\{\\dots, -6, -3, 0, 3, 6, \\dots\\}',
    lattice: {
      memberX: integer,
      memberY: integer,
      partners: (a) => [3 * a],
      pairs: [
        [0, 0],
        [1, 3],
        [-1, -3],
        [2, 6],
        [-2, -6],
      ],
      pairTex: (a, b) => `a = ${valueTex(a)}:\\ b = 3 \\cdot ${groupedTex(a)} = ${valueTex(b)}`,
      litX: [-4, -3, -2, -1, 1, 2, 3, 4],
      litY: [-12, -9, -6, -3, 3, 6, 9, 12],
    },
  },
  positive: {
    view: realView,
    slider: realSlider,
    start: 2,
    universal: true,
    ruleTex: `a ${Rel} b \\iff ab > 0`,
    given: 'a, b \\in \\mathbb R',
    firstTex: 'A = \\mathbb R',
    secondTex: 'B = \\mathbb R',
    domainTex: '\\mathbb R \\setminus \\{0\\}',
    codomainTex: '\\mathbb R \\setminus \\{0\\}',
    lattice: null,
  },
}

const regionRows = ['a > 0,\\ b > 0 \\Rightarrow ab > 0', 'a < 0,\\ b < 0 \\Rightarrow ab > 0', 'a = 0 \\Rightarrow 0 \\cdot b = 0']
const regionReasons = ['quadrantI', 'quadrantIII', 'zero'] as const

type Exercise = { first: number[]; second: number[]; given: string; items: { cond: string; holds: (a: number, b: number) => boolean }[] }
const exercises: Record<'rule' | 'domain', Exercise> = {
  rule: {
    first: [2, 3],
    second: [1, 2, 3, 4],
    given: 'A = \\{2, 3\\},\\ B = \\{1, 2, 3, 4\\}',
    items: [
      { cond: 'a > b', holds: (a, b) => a > b },
      { cond: 'a \\ge b', holds: (a, b) => a >= b },
      { cond: 'ab < 8', holds: (a, b) => a * b < 8 },
      { cond: 'b - a = 1', holds: (a, b) => b - a === 1 },
      { cond: 'b + a > 4', holds: (a, b) => b + a > 4 },
    ],
  },
  domain: {
    first: [2, 4, 6],
    second: [2, 4, 6],
    given: 'A = \\{2, 4, 6\\},\\ a, b \\in A',
    items: [
      { cond: 'a \\ge b', holds: (a, b) => a >= b },
      { cond: 'a + 1 \\le b', holds: (a, b) => a + 1 <= b },
      { cond: 'ab < 20', holds: (a, b) => a * b < 20 },
      { cond: 'a - b = 2', holds: (a, b) => a - b === 2 },
      { cond: 'a + b \\le 8', holds: (a, b) => a + b <= 8 },
    ],
  },
}

const numbers = (values: number[]): RelationMember[] => values.map((value) => ({ label: numberLabel(value), tex: valueTex(value), kind: 'number', value }))
const words = (labels: string[]): RelationMember[] => labels.map((label) => ({ label, tex: `\\text{${label}}`, kind: 'word' }))
const pairTex = (entry: MeaningEntry) => `(${entry.a.tex}, ${entry.b.tex})`
const relationTex = (a: string, b: string, holds: boolean) => (holds ? `${a} ${Rel} ${b}` : `\\neg(${a} ${Rel} ${b})`)
const memberTex = (holds: boolean) => (holds ? '\\in' : '\\notin')
const coordinateTex = ([x, y]: Coordinate) => `(${valueTex(x)}, ${valueTex(y)})`
const isMeaning = (key: SampleKey): key is MeaningKey => (meaningKeys as SampleKey[]).includes(key)
const isRule = (key: SampleKey): key is RuleSampleKey => (ruleSampleKeys as SampleKey[]).includes(key)

export function RelationsPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.relations' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('relations')
  const [group, setGroup] = useState<GroupKey>('meaning')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [values, setValues] = useState<Partial<Record<string, number>>>({})
  const [pick, setPick] = useState<string | null>(null)
  const [delay, setDelay] = useState(1.5)

  const sampleKey = groupSamples[group][exampleIndex]
  const total = stepsOf(sampleKey)
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const reached = (index: number) => current === null || current >= index

  function stepsOf(key: SampleKey) {
    if (isMeaning(key)) return meaningEntries(meaningSamples[key]).length + 1
    if (isRule(key)) return ruleSamples[key].pairs.length + 1
    const lattice = domainSamples[key].lattice
    return lattice ? lattice.pairs.length + 2 : 5
  }

  function localize(tex: string) {
    return tex.replaceAll('\\text{ even}', `\\text{ ${t('words.even')}}`)
  }

  function membersOf(source: MemberSource): RelationMember[] {
    if (source === 'children') return words(childNames)
    if (source === 'sports') return words(t('members.sports', { returnObjects: true }))
    if (source === 'siblings') return words(t('members.siblings', { returnObjects: true }))
    if (source === 'odd') return numbers([1, 3, 5, 7])
    if (source === 'even') return numbers([2, 4])
    if (source === 'small') return numbers([1, 2])
    return ['a', 'b', 'c'].map((label) => ({ label, tex: label, kind: 'letter' }))
  }

  function setOf(side: MeaningSample['first']): RelationSet {
    return { name: side.name, members: membersOf(side.source) }
  }

  function meaningEntries(sample: MeaningSample): MeaningEntry[] {
    const first = membersOf(sample.first.source)
    const second = membersOf(sample.second.source)
    return first.flatMap((a, i) => second.map((b, j) => ({ i, j, a, b, holds: sample.holds(i, j, a, b) })))
  }

  const valueOf = (name: string, start: number) => values[`${sampleKey}.${name}`] ?? start

  function chooseGroup(next: GroupKey) {
    player.stop()
    setPick(null)
    setExampleIndex(0)
    setGroup(next)
  }

  function chooseExample(index: number) {
    player.stop()
    setPick(null)
    setExampleIndex(index)
  }

  function move(name: string, next: number) {
    setValues((previous) => ({ ...previous, [`${sampleKey}.${name}`]: next }))
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setPick(null)
    player.start()
  }

  function stamp(tex: string, done: boolean) {
    return (
      <Stamp key={tex} tone={done ? 'yes' : 'pending'}>
        <MathTex tex={tex} />
      </Stamp>
    )
  }

  function meaningView(key: MeaningKey) {
    const sample = meaningSamples[key]
    const first = setOf(sample.first)
    const second = setOf(sample.second)
    const entries = meaningEntries(sample)
    const count = entries.filter((entry) => entry.holds).length
    const product = `${first.name} \\times ${second.name}`
    const pairs: RelationPair[] = entries.map((entry, index) => ({ i: entry.i, j: entry.j, holds: entry.holds, checked: reached(index) }))
    const focusIndex = current !== null ? (current < entries.length ? current : -1) : entries.findIndex((entry) => `${entry.i}-${entry.j}` === pick)
    const focus = focusIndex >= 0 ? entries[focusIndex] : null
    const nameOf = (member: RelationMember) => (member.kind === 'word' ? member.label : member.tex)

    function why(entry: MeaningEntry) {
      if (key === 'older' && entry.i === entry.j) return t('why.older.self', { a: nameOf(entry.a) })
      return t(`why.${key}.${entry.holds ? 'holds' : 'fails'}`, { a: nameOf(entry.a), b: nameOf(entry.b) })
    }

    const read = (entry: MeaningEntry) =>
      t('reading.pair', { pair: pairTex(entry), why: why(entry), relation: relationTex(entry.a.tex, entry.b.tex, entry.holds), member: memberTex(entry.holds) })

    function list(holds: boolean) {
      const shown = entries.filter((entry, index) => entry.holds === holds && reached(index))
      return (
        <p data-list={holds ? 'holds' : 'fails'} className="mt-2 leading-loose">
          <span className="mr-2.5 font-hand text-[21px] leading-none font-bold">{t(holds ? 'lists.holds' : 'lists.fails')}</span>
          {shown.length === 0 && <span className="text-faint">{t(holds ? 'lists.noneYet' : 'lists.none')}</span>}
          {shown.map((entry) => (
            <span
              key={`${entry.i}-${entry.j}`}
              data-item={`${entry.i}-${entry.j}`}
              className={`mr-3 inline-block ${entry === focus ? 'bg-highlight-soft px-1' : ''}`}
            >
              <MathTex tex={relationTex(entry.a.tex, entry.b.tex, entry.holds)} />
            </span>
          ))}
        </p>
      )
    }

    return {
      equation: (
        <>
          <span className="text-[17px]">
            <MathText text={t(`statements.${key}`)} />
          </span>
          {stamp(`\\mathrm R \\subseteq ${product}`, reached(entries.length))}
        </>
      ),
      figure: (
        <RelationArrowGridBoard
          first={first}
          second={second}
          pairs={pairs}
          focus={focus ? (pairs[focusIndex] ?? null) : null}
          interactive={current === null}
          onPick={(pair) => setPick((previous) => (previous === `${pair.i}-${pair.j}` ? null : `${pair.i}-${pair.j}`))}
          ariaLabel={t('aria.arrows')}
        />
      ),
      sliders: null,
      steps: (
        <div data-lists>
          {list(true)}
          {list(false)}
        </div>
      ),
      captions: [...entries.map(read), t('steps.meaningDone', { count, total: entries.length, product })],
      reading: focus ? read(focus) : t('reading.summary', { count, total: entries.length, product }),
    }
  }

  function testText(sample: RuleSample, x: number, y: number) {
    const holds = sample.holds(x, y)
    const expression = sample.expression(x, y)
    if (sample.test === 'product') return t(holds ? 'tests.product.holds' : 'tests.product.fails', { expression, condition: sample.cond })
    const verdict = sample.test === 'compare' ? t(holds ? 'words.true' : 'words.false') : t(holds ? 'words.even' : 'words.odd')
    return t('tests.compare', { expression, verdict })
  }

  function regionShapes(kind: RegionKind, view: PlaneView) {
    const [xl, xh] = view.x
    const [yl, yh] = view.y
    const regions: PlaneRegion[] = []
    const bands: PlaneBand[] = []
    if (kind === 'negative') regions.push({ x: [xl, 0], y: [0, yh] }, { x: [0, xh], y: [yl, 0] })
    if (kind === 'nonnegative') {
      regions.push({ x: [0, xh], y: [0, yh] }, { x: [xl, 0], y: [yl, 0] })
      bands.push({ from: [xl, 0], to: [xh, 0] }, { from: [0, yl], to: [0, yh] })
    }
    return { regions, bands, curve: kind === 'one' }
  }

  function sliderOf(name: string, range: SliderRange, value: number) {
    const variable = <i className="font-math-italic">{name}</i>
    return (
      <PenSlider
        key={name}
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
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        disabled={false}
        onChange={(next) => move(name, next)}
      />
    )
  }

  const emptyPlane = () => ({
    litX: [] as number[],
    litY: [] as number[],
    lattice: [] as Coordinate[],
    dots: [] as Coordinate[],
    misses: [] as Coordinate[],
    rings: [] as Coordinate[],
    regions: [] as PlaneRegion[],
    bands: [] as PlaneBand[],
    curve: false,
    openDots: [] as Coordinate[],
    shadows: [] as PlaneBand[],
    verticals: [] as PlaneVertical[],
    probe: null as PlaneProbe | null,
    note: null as PlaneNote | null,
  })

  const probeLabel = ([x, y]: Coordinate) => `(${numberLabel(x)}, ${numberLabel(y)})`

  function ruleView(key: RuleSampleKey) {
    const sample = ruleSamples[key]
    const { view } = sample
    const [v1, v2] = sample.vars
    const count = sample.pairs.length
    const final = reached(count)
    const x = valueOf(v1, sample.start[0])
    const y = valueOf(v2, sample.start[1])
    const plane = emptyPlane()
    if (sample.member) {
      const member = sample.member
      for (const px of range(view.x[0], view.x[1])) {
        for (const py of range(view.y[0], view.y[1])) {
          if (!member(px) || !member(py)) continue
          if (final && sample.holds(px, py)) plane.dots = [...plane.dots, [px, py]]
          else plane.lattice = [...plane.lattice, [px, py]]
        }
      }
    } else if (final && sample.region) {
      Object.assign(plane, regionShapes(sample.region, view))
    }
    if (current !== null) {
      sample.pairs.forEach((pair, index) => {
        if (index > current || !inView(view, pair)) return
        const holds = sample.holds(pair[0], pair[1])
        const already = plane.dots.some(([dx, dy]) => dx === pair[0] && dy === pair[1])
        if (holds && !already) plane.dots = [...plane.dots, pair]
        if (!holds) plane.misses = [...plane.misses, pair]
        if (index === current) plane.rings = [pair]
      })
    } else {
      plane.probe = { at: [x, y], holds: sample.holds(x, y), label: probeLabel([x, y]) }
    }

    const rows: StepTableRow[] = sample.pairs.map((pair, index) => {
      const holds = sample.holds(pair[0], pair[1])
      const outside = inView(view, pair) ? '' : ` ${t('words.outside')}`
      return {
        key: `pair${index}`,
        tex: relationTex(groupedTex(pair[0]), groupedTex(pair[1]), holds),
        reason: testText(sample, pair[0], pair[1]) + outside,
        flip: false,
        testTex: `${coordinateTex(pair)} ${memberTex(holds)} \\mathrm R`,
        holds,
        visible: reached(index),
        now: current === index,
      }
    })
    rows.push({
      key: 'pattern',
      tex: localize(`\\mathrm R = \\{(${v1}, ${v2}) \\in ${sample.set} \\times ${sample.set} \\mid ${sample.cond}\\}`),
      reason: t('reasons.pattern', { pattern: t(`patterns.${key}`) }),
      flip: false,
      testTex: '',
      holds: false,
      visible: reached(count),
      now: current === count,
    })

    const captions = [
      ...sample.pairs.map((pair) => {
        const holds = sample.holds(pair[0], pair[1])
        return t('steps.rulePair', {
          pair: coordinateTex(pair),
          test: testText(sample, pair[0], pair[1]),
          relation: relationTex(groupedTex(pair[0]), groupedTex(pair[1]), holds),
        })
      }),
      t('steps.rulePattern', { pattern: t(`patterns.${key}`) }),
    ]
    const holds = sample.holds(x, y)
    const probeText = t('reading.probe', {
      vars: `(${v1}, ${v2})`,
      pair: coordinateTex([x, y]),
      test: testText(sample, x, y),
      member: memberTex(holds),
    })

    return {
      equation: (
        <>
          <span className="text-[17px]">
            <MathTex tex={localize(`${sample.ruleTex},\\ ${v1}, ${v2} \\in ${sample.set}`)} />
          </span>
          {stamp(`\\mathrm R \\subseteq ${sample.set} \\times ${sample.set}`, reached(count))}
        </>
      ),
      figure: <RelationPlaneBoard view={view} axisNames={[v1, v2]} {...plane} axisLabel={numberLabel} ariaLabel={t('aria.plane')} />,
      sliders: [sliderOf(v1, sample.sliders[0], x), sliderOf(v2, sample.sliders[1], y)],
      steps: <InequalityStepsTable rows={rows} stepHeader={t('table.step')} testHeader="" verdicts={null} markTest />,
      captions,
      reading: current === null ? probeText : captions[current],
    }
  }

  function domainView(key: DomainKey) {
    const sample = domainSamples[key]
    const { view, lattice } = sample
    const [xl, xh] = view.x
    const [yl, yh] = view.y
    const dStep = lattice ? lattice.pairs.length : 3
    const showD = reached(dStep)
    const showR = reached(dStep + 1)
    const a = valueOf('a', sample.start)
    const plane = emptyPlane()
    let rows: StepTableRow[]
    let captions: string[]
    let reading: string

    if (lattice) {
      plane.litX = showD ? lattice.litX : []
      plane.litY = showR ? lattice.litY : []
      for (const x of range(xl, xh)) for (const y of range(yl, yh)) if (lattice.memberX(x) && lattice.memberY(y)) plane.lattice.push([x, y])
      const all = range(xl, xh)
        .filter(lattice.memberX)
        .flatMap((x) => lattice.partners(x).map((y): Coordinate => [x, y]))
        .filter((point) => inView(view, point))
      const shown = reached(lattice.pairs.length) ? all : lattice.pairs.slice(0, (current ?? 0) + 1)
      if (showD) plane.shadows.push(...shown.map(([x, y]): PlaneBand => ({ from: [x, y], to: [x, 0] })))
      if (showR) plane.shadows.push(...shown.map(([x, y]): PlaneBand => ({ from: [x, y], to: [0, y] })))
      if (showD) plane.dots.push(...shown.map(([x]): Coordinate => [x, 0]))
      if (showR) plane.dots.push(...shown.map(([, y]): Coordinate => [0, y]))
      plane.dots.push(...shown)
      if (current !== null && current < lattice.pairs.length) plane.rings = [lattice.pairs[current]]
      rows = lattice.pairs.map(([x, y], index) => ({
        key: `pair${index}`,
        tex: lattice.pairTex(x, y),
        reason: t(`pairWhy.${key as 'sqrt' | 'triple'}`, { b: valueTex(y) }),
        flip: false,
        testTex: `${coordinateTex([x, y])} \\in \\mathrm R`,
        holds: true,
        visible: reached(index),
        now: current === index,
      }))
      captions = lattice.pairs.map(([x, y]) => t('steps.domainPair', { work: lattice.pairTex(x, y), pair: coordinateTex([x, y]) }))
      if (current === null) {
        const [b] = lattice.partners(a)
        if (b === undefined) {
          plane.verticals = [{ x: a, tone: 'none' }]
          plane.note = { x: a, text: t('words.noB') }
        } else {
          plane.verticals = [{ x: a, tone: 'probe' }]
          plane.probe = { at: [a, b], holds: true, label: probeLabel([a, b]) }
        }
      }
      if (key === 'sqrt') {
        const [b] = lattice.partners(a)
        reading =
          b === undefined
            ? t('reading.sqrtNone', { a: valueTex(a), root: `\\sqrt{${a}}` })
            : t('reading.sqrtHas', { a: valueTex(a), root: `\\sqrt{${a}} = ${b}`, b: valueTex(b) })
      } else {
        reading = t('reading.triple', { a: valueTex(a), work: `3 \\cdot ${groupedTex(a)} = ${valueTex(3 * a)}`, b: valueTex(3 * a) })
      }
    } else {
      if (reached(0)) plane.regions.push({ x: [0, xh], y: [0, yh] })
      if (reached(1)) plane.regions.push({ x: [xl, 0], y: [yl, 0] })
      if (current === 2) plane.verticals = [{ x: 0, tone: 'zero' }]
      if (showD) plane.bands.push({ from: [0, 0], to: [xl, 0], gapAtFrom: true }, { from: [0, 0], to: [xh, 0], gapAtFrom: true })
      if (showR) plane.bands.push({ from: [0, 0], to: [0, yl], gapAtFrom: true }, { from: [0, 0], to: [0, yh], gapAtFrom: true })
      if (showD || showR) plane.openDots = [[0, 0]]
      if (current === null) {
        if (near(a, 0)) {
          plane.verticals = [{ x: 0, tone: 'none' }]
          plane.note = { x: 0, text: t('words.noB') }
        } else {
          plane.verticals = [{ x: a, tone: 'probe' }]
          plane.bands = [...plane.bands, { from: [a, 0], to: [a, a > 0 ? yh : yl], gapAtFrom: true }]
          plane.openDots = [...plane.openDots, [a, 0]]
        }
      }
      rows = regionRows.map((tex, index) => ({
        key: regionReasons[index],
        tex,
        reason: t(`reasons.${regionReasons[index]}`),
        flip: index === 2,
        testTex: '',
        holds: false,
        visible: reached(index),
        now: current === index,
      }))
      captions = regionReasons.map((reason) => t(`steps.${reason}`))
      reading = near(a, 0) ? t('reading.positiveZero') : t(a > 0 ? 'reading.positiveUp' : 'reading.positiveDown', { a: valueTex(a) })
    }

    rows.push(
      {
        key: 'domain',
        tex: `${Dom} = ${sample.domainTex}`,
        reason: t('reasons.domain', { why: t(`domainWhy.${key}`) }),
        flip: false,
        testTex: '',
        holds: false,
        visible: showD,
        now: current === dStep,
      },
      {
        key: 'codomain',
        tex: `${Cod} = ${sample.codomainTex}`,
        reason: t('reasons.codomain', { why: t(`codomainWhy.${key}`) }),
        flip: false,
        testTex: '',
        holds: false,
        visible: showR,
        now: current === dStep + 1,
      },
    )
    captions.push(t('steps.domain', { set: sample.domainTex }), t('steps.codomain', { set: sample.codomainTex }))

    return {
      equation: (
        <>
          <span className="text-[17px]">
            <MathTex tex={`${sample.ruleTex},\\ ${sample.given}`} />
          </span>
          {stamp(`${Dom} = ${sample.domainTex}`, showD)}
          {stamp(`${Cod} = ${sample.codomainTex}`, showR)}
        </>
      ),
      figure: <RelationPlaneBoard view={view} axisNames={['a', 'b']} {...plane} axisLabel={numberLabel} ariaLabel={t('aria.plane')} />,
      sliders: [sliderOf('a', sample.slider, a)],
      steps: <InequalityStepsTable rows={rows} stepHeader={t('table.step')} testHeader="" verdicts={null} markTest />,
      captions,
      reading: current === null ? reading : captions[current],
    }
  }

  const boardView = isMeaning(sampleKey) ? meaningView(sampleKey) : isRule(sampleKey) ? ruleView(sampleKey) : domainView(sampleKey as DomainKey)

  function productCard(key: MeaningKey) {
    const sample = meaningSamples[key]
    const first = setOf(sample.first)
    const second = setOf(sample.second)
    const entries = meaningEntries(sample)
    const members = entries.filter((entry) => entry.holds)
    const product = `${first.name} \\times ${second.name}`
    const size = first.members.length * second.members.length
    return (
      <TitledCard key="product" title={<MathText text={t('cards.product', { product })} />} wide>
        <div data-product>
          <SetItemsList head="\mathrm R = \{" items={members.map((entry) => ({ key: `${entry.i}-${entry.j}`, tex: pairTex(entry), lit: true }))} />
          <SetItemsList
            head={`${product} = \\{`}
            items={entries.map((entry) => ({ key: `${entry.i}-${entry.j}`, tex: pairTex(entry), lit: entry.holds }))}
          />
        </div>
        <p className={footnoteClass}>
          <MathText text={t('product.count', { count: members.length, product, first: first.members.length, second: second.members.length, size })} />
        </p>
        <p className="mt-1.5 text-sm text-muted">
          <MathText text={t(members.length === entries.length ? 'product.equal' : 'product.subset', { product })} />
        </p>
      </TitledCard>
    )
  }

  function universalCard(key: MeaningKey) {
    const sample = meaningSamples[key]
    const items = t('universal.items', { returnObjects: true })
    return (
      <TitledCard key="universal" title={t('cards.universal')}>
        <p data-universal={sample.universal} className="mb-3.5">
          <MathText text={t(sample.universal ? 'universal.yes' : 'universal.no', { first: sample.first.name, second: sample.second.name })} />
        </p>
        <FormulaList items={items.map((item, index) => ({ key: String(index), tex: item.tex, remark: item.remark }))} />
      </TitledCard>
    )
  }

  function ruleCard(key: RuleSampleKey) {
    const sample = ruleSamples[key]
    const [v1, v2] = sample.vars
    const x = valueOf(v1, sample.start[0])
    const y = valueOf(v2, sample.start[1])
    const holds = sample.holds(x, y)
    return (
      <TitledCard key="rule" title={t('cards.rule')}>
        <FormulaList
          items={[
            { key: 'rule', tex: localize(sample.ruleTex), remark: t('ruleCard.rule') },
            { key: 'substitute', tex: `${v1} = ${valueTex(x)},\\ ${v2} = ${valueTex(y)}`, remark: t('ruleCard.substitute') },
            { key: 'test', tex: sample.expression(x, y), remark: testText(sample, x, y) },
            { key: 'result', tex: `${coordinateTex([x, y])} ${memberTex(holds)} \\mathrm R`, remark: t('ruleCard.result') },
          ]}
        />
      </TitledCard>
    )
  }

  function nonNumberCard() {
    const items = t('nonNumber.items', { returnObjects: true })
    return (
      <TitledCard key="nonNumber" title={t('cards.nonNumber')}>
        <FormulaList items={items.map((item, index) => ({ key: String(index), tex: item.tex, remark: item.remark }))} />
      </TitledCard>
    )
  }

  function exerciseCard(which: 'rule' | 'domain') {
    const exercise = exercises[which]
    return (
      <TitledCard key="others" title={t('cards.others')} wide>
        <p className="mb-3 text-[15px] text-muted">
          <MathTex tex={exercise.given} />
        </p>
        <div className="grid gap-3.5">
          {exercise.items.map((item, index) => {
            const name = `\\mathrm R_${index + 1}`
            const pairs = pairsWhere(exercise.first, exercise.second, item.holds)
            return (
              <div key={item.cond} data-exercise={index + 1} data-count={pairs.length}>
                <p className="text-[15px] text-muted">
                  <MathTex tex={`${name}:\\ ${item.cond}`} />
                </p>
                {pairs.length > 0 ? (
                  <SetItemsList head={`${name} = \\{`} items={pairs.map((pair) => ({ key: pair.join(','), tex: `(${pair[0]}, ${pair[1]})`, lit: false }))} />
                ) : (
                  <p>
                    <MathTex tex={`${name} = \\varnothing`} />
                  </p>
                )}
                {which === 'domain' && (
                  <p className="text-sm text-muted">
                    <MathTex
                      tex={`D(${name}) = ${setTex(uniqueSorted(pairs.map(([a]) => a)))},\\ \\mathit R(${name}) = ${setTex(uniqueSorted(pairs.map(([, b]) => b)))}`}
                    />
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </TitledCard>
    )
  }

  function domainCard(key: DomainKey) {
    const sample = domainSamples[key]
    return (
      <TitledCard key="domain" title={t('cards.domain')}>
        <FormulaList
          items={[
            { key: 'first', tex: sample.firstTex, remark: t('domainCard.first') },
            { key: 'domain', tex: `${Dom} = ${sample.domainTex}`, remark: t('domainCard.domain') },
            { key: 'second', tex: sample.secondTex, remark: t('domainCard.second') },
            { key: 'codomain', tex: `${Cod} = ${sample.codomainTex}`, remark: t('domainCard.codomain') },
          ]}
        />
        <p className={footnoteClass}>
          <MathText text={t('domainCard.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function universalOf(key: SampleKey) {
    if (isMeaning(key)) return meaningSamples[key].universal
    if (isRule(key)) return true
    return domainSamples[key as DomainKey].universal
  }

  function formulaActive(key: FormulaKey) {
    if (key === 'universal') return universalOf(sampleKey)
    if (key === 'subset') return group === 'meaning'
    if (key === 'domain' || key === 'codomain') return group === 'domain'
    return group !== 'domain'
  }

  function rulesCard() {
    return (
      <TitledCard key="rules" title={t('cards.rules')} wide>
        <table className="w-full border-collapse text-left">
          <tbody>
            {formulaKeys.map((key) => {
              const active = formulaActive(key)
              return (
                <tr key={key} data-rule={key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                  <td className={cellClass}>
                    <MathTex tex={t(`rules.formulas.${key}`)} />
                    <span className="block text-sm text-muted">
                      <MathText text={t(`rules.names.${key}`)} />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className={footnoteClass}>
          <MathText text={t('rules.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function groupCards(): ReactNode[] {
    if (isMeaning(sampleKey)) return [productCard(sampleKey), universalCard(sampleKey)]
    if (isRule(sampleKey)) return [ruleCard(sampleKey), nonNumberCard(), exerciseCard('rule')]
    return [domainCard(sampleKey as DomainKey), exerciseCard('domain')]
  }

  const legendIcons: Record<LegendKey, ReactNode> = {
    arrow: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={1.8} className="stroke-ink" />
        <path d="M40 11 L30.7 7.3 L30.7 14.7 Z" className="fill-ink" />
      </>
    ),
    arrowNow: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={2.2} strokeDasharray="6 4" className="stroke-marker" />
        <path d="M40 11 L30.7 7.3 L30.7 14.7 Z" className="fill-marker" />
      </>
    ),
    member: (
      <>
        <circle cx={22} cy={11} r={9} className="fill-highlight" />
        <circle cx={22} cy={11} r={4.5} className="fill-ink" />
      </>
    ),
    miss: <path d="M17 6 L27 16 M17 16 L27 6" strokeWidth={1.8} className="stroke-muted" />,
    lattice: <circle cx={22} cy={11} r={2.5} className="fill-faint" />,
    region: <rect x={4} y={3} width={36} height={16} className="fill-highlight opacity-40" />,
    probe: <circle cx={22} cy={11} r={8} strokeWidth={2.2} className="fill-none stroke-marker" />,
    shadow: <line x1={4} x2={40} y1={11} y2={11} strokeWidth={1.1} strokeDasharray="3 3" className="stroke-muted" />,
    probeLine: <line x1={22} x2={22} y1={1} y2={21} strokeWidth={1.4} strokeDasharray="6 4" className="stroke-ink" />,
    open: <circle cx={22} cy={11} r={5} strokeWidth={1.8} className="fill-paper stroke-ink" />,
    not: (
      <text x={22} y={16} textAnchor="middle" className="fill-ink font-math text-[16px]">
        ¬
      </text>
    ),
  }

  const idleText = group === 'meaning' ? t('idle.meaning') : isRule(sampleKey) ? t('idle.two', { first: ruleSamples[sampleKey].vars[0], second: ruleSamples[sampleKey].vars[1] }) : t('idle.one', { first: 'a' })

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
                <MathText text={t(`chips.${key}`)} />
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
          {boardView.figure}
          {boardView.sliders}
          <div className="mt-3">{boardView.steps}</div>
          <p data-reading className="mt-2.5 min-h-[1.6em] text-[17px] [&_.katex]:text-[1.15em]!">
            <MathText text={boardView.reading} />
          </p>
        </TitledCard>
      }
      progress={
        <StepProgress total={total} current={current} caption={current !== null && <MathText text={boardView.captions[current]} />} idleText={idleText} />
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
