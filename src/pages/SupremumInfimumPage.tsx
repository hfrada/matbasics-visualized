import { Fragment, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { Stamp } from '../components/atoms/Stamp'
import { SvgMathName } from '../components/atoms/SvgMathName'
import { TabButton } from '../components/atoms/TabButton'
import { Title } from '../components/atoms/Title'
import { FormulaList } from '../components/molecules/FormulaList'
import { LabelledRows } from '../components/molecules/LabelledRows'
import { NoteCard } from '../components/molecules/NoteCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PenSlider } from '../components/molecules/PenSlider'
import { PlayButton } from '../components/molecules/PlayButton'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { TitledCard } from '../components/molecules/TitledCard'
import {
  BoundsLineBoard,
  type BoundsLineView,
  type BoundsProbe,
  type BoundsRow,
  type BoundsWitness,
} from '../components/organisms/BoundsLineBoard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { InequalityStepsTable, type StepTableRow } from '../components/organisms/InequalityStepsTable'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  boundedInterval,
  inBoundedSet,
  infimumOf,
  isLowerBound,
  isUpperBound,
  memberAbove,
  memberBelow,
  supremumOf,
  type BoundedSet,
  type SequenceSet,
  type Witness,
} from '../lib/bounds'
import { numberLabel, numberTex } from '../lib/numberLabel'

type GroupKey = 'bounds' | 'supInf' | 'sequences'
type BoundsKey = 'boundsA' | 'boundsB' | 'boundsC' | 'boundsR'
type SupInfKey = 'supA' | 'supB' | 'supC' | 'supD' | 'supE'
type SequenceKey = 'sequenceD' | 'sequenceE' | 'sequenceN'
type SampleKey = BoundsKey | SupInfKey | SequenceKey
type VariableName = 'a' | 'b' | 'y'
type RuleKey = 'upper' | 'lower' | 'sup' | 'inf' | 'completeUpper' | 'completeLower' | 'unique'
type LegendKey = 'set' | 'sequence' | 'probe' | 'witness' | 'bounds' | 'bestMember' | 'bestOutside'

type LineView = BoundsLineView & { min: number; max: number; step: number; decimals: boolean }
type Sample = {
  name: string
  svgName: string
  chip: string
  setTex: string
  set: BoundedSet
  view: LineView
  start: Partial<Record<VariableName, number>>
  termTex?: (n: number) => string
  termLabel?: (n: number) => string
}

const groupKeys: GroupKey[] = ['bounds', 'supInf', 'sequences']
const groupSamples: Record<GroupKey, SampleKey[]> = {
  bounds: ['boundsA', 'boundsB', 'boundsC', 'boundsR'],
  supInf: ['supA', 'supB', 'supC', 'supD', 'supE'],
  sequences: ['sequenceD', 'sequenceE', 'sequenceN'],
}
const groupVariables: Record<GroupKey, VariableName[]> = { bounds: ['b', 'a'], supInf: ['y'], sequences: ['y'] }
const groupSteps: Record<GroupKey, number> = { bounds: 4, supInf: 5, sequences: 5 }
const delays = [0.5, 1, 1.5, 2, 3]
const decimalText = '{,}'
const noneText = '\\text{none}'

const intervalView: LineView = { lo: -2, hi: 6, unit: 1, labelStep: 1, min: -1, max: 5, step: 0.25, decimals: false }
const unitView: LineView = { lo: -0.25, hi: 1.25, unit: 0.25, labelStep: 0.5, min: -0.25, max: 1.25, step: 0.05, decimals: true }
const naturalView: LineView = { lo: -1, hi: 11, unit: 1, labelStep: 1, min: 0, max: 10, step: 0.25, decimals: false }

const reciprocals: SequenceSet = { kind: 'sequence', term: (n) => 1 / n, index: (value) => 1 / value, sup: 1, inf: 0 }
const ratios: SequenceSet = { kind: 'sequence', term: (n) => n / (n + 1), index: (value) => value / (1 - value), sup: 1, inf: 0.5 }
const naturals: SequenceSet = { kind: 'sequence', term: (n) => n, index: (value) => value, sup: null, inf: 1 }

const intervalA = boundedInterval(1, 3, false, true)
const belowThree = boundedInterval(-Infinity, 3)

const samples: Record<SampleKey, Sample> = {
  boundsA: { name: 'A', svgName: 'A', chip: 'A = (1, 3]', setTex: 'A = \\{x \\mid 1 < x \\le 3\\} = (1, 3]', set: intervalA, view: intervalView, start: { b: 4, a: 0 } },
  boundsB: { name: 'B', svgName: 'B', chip: 'B = \\{x \\mid x < 3\\}', setTex: 'B = \\{x \\mid x < 3\\}', set: belowThree, view: intervalView, start: { b: 4, a: 0 } },
  boundsC: { name: 'C', svgName: 'C', chip: 'C = \\{x \\mid x \\ge 2\\}', setTex: 'C = \\{x \\mid x \\ge 2\\}', set: boundedInterval(2, Infinity, true), view: intervalView, start: { b: 4, a: 1 } },
  boundsR: { name: '\\mathbb{R}', svgName: 'ℝ', chip: '\\mathbb{R}', setTex: '\\mathbb{R}', set: boundedInterval(-Infinity, Infinity), view: intervalView, start: { b: 4, a: 0 } },
  supA: { name: 'A', svgName: 'A', chip: 'A = (1, 3]', setTex: 'A = \\{x \\mid 1 < x \\le 3\\} = (1, 3]', set: intervalA, view: intervalView, start: { y: 2.5 } },
  supB: { name: 'B', svgName: 'B', chip: 'B = \\{x \\mid x < 3\\}', setTex: 'B = \\{x \\mid x < 3\\}', set: belowThree, view: intervalView, start: { y: 2.5 } },
  supC: { name: 'C', svgName: 'C', chip: 'C = \\{x \\mid x > 2\\}', setTex: 'C = \\{x \\mid x > 2\\}', set: boundedInterval(2, Infinity), view: intervalView, start: { y: 2.5 } },
  supD: { name: 'D', svgName: 'D', chip: 'D = (2, 3)', setTex: 'D = \\{x \\mid 2 < x < 3\\} = (2, 3)', set: boundedInterval(2, 3), view: intervalView, start: { y: 2.5 } },
  supE: { name: 'E', svgName: 'E', chip: 'E = [2, 3]', setTex: 'E = \\{x \\mid 2 \\le x \\le 3\\} = [2, 3]', set: boundedInterval(2, 3, true, true), view: intervalView, start: { y: 2.5 } },
  sequenceD: {
    name: 'D',
    svgName: 'D',
    chip: 'D = \\{\\tfrac{1}{n}\\}',
    setTex: 'D = \\left\\{\\tfrac{1}{n} \\,\\middle|\\, n \\in \\mathbb{N}\\right\\} = \\left\\{1, \\tfrac{1}{2}, \\tfrac{1}{3}, \\dots\\right\\}',
    set: reciprocals,
    view: unitView,
    start: { y: 0.3 },
    termTex: (n) => (n === 1 ? '1' : `\\tfrac{1}{${n}}`),
    termLabel: (n) => (n === 1 ? '1' : `1/${n}`),
  },
  sequenceE: {
    name: 'E',
    svgName: 'E',
    chip: 'E = \\{\\tfrac{n}{n+1}\\}',
    setTex: 'E = \\left\\{\\tfrac{n}{n+1} \\,\\middle|\\, n \\in \\mathbb{N}\\right\\} = \\left\\{\\tfrac{1}{2}, \\tfrac{2}{3}, \\tfrac{3}{4}, \\dots\\right\\}',
    set: ratios,
    view: unitView,
    start: { y: 0.8 },
    termTex: (n) => `\\tfrac{${n}}{${n + 1}}`,
    termLabel: (n) => `${n}/${n + 1}`,
  },
  sequenceN: {
    name: '\\mathbb{N}',
    svgName: 'ℕ',
    chip: '\\mathbb{N}',
    setTex: '\\mathbb{N} = \\{1, 2, 3, \\dots\\}',
    set: naturals,
    view: naturalView,
    start: { y: 4.5 },
    termTex: (n) => String(n),
    termLabel: (n) => String(n),
  },
}

const ruleKeys: RuleKey[] = ['upper', 'lower', 'sup', 'inf', 'completeUpper', 'completeLower', 'unique']
const groupRules: Record<GroupKey, RuleKey[]> = { bounds: ['upper', 'lower'], supInf: ['sup', 'inf'], sequences: ['sup', 'inf'] }
const legendKeys: Record<GroupKey, LegendKey[]> = {
  bounds: ['set', 'probe', 'witness', 'bounds'],
  supInf: ['set', 'probe', 'witness', 'bounds', 'bestMember', 'bestOutside'],
  sequences: ['sequence', 'probe', 'witness', 'bounds', 'bestMember', 'bestOutside'],
}
const completenessFormulas = [
  'A = \\{x \\in \\mathbb{Q} \\mid x > 0,\\ x^2 < 2\\}',
  '2,\\ 1{,}5,\\ 1{,}42,\\ 1{,}415,\\ 1{,}4143,\\ \\dots',
  '\\sup A = \\sqrt{2} \\approx 1{,}41421 \\notin \\mathbb{Q}',
]
const uniqueFormulas = ['a = \\inf A,\\ b = \\inf A', 'b \\le a', 'a \\le b', 'a = b']
const otherExamples = [
  '\\{x \\mid -101 < x \\le 1\\tfrac{1}{2}\\}:\\ \\sup = 1\\tfrac{1}{2},\\ \\inf = -101',
  '\\{x \\mid 2 \\le x < 199\\tfrac{1}{4}\\}:\\ \\sup = 199\\tfrac{1}{4},\\ \\inf = 2',
  `\\{x \\mid x < 13\\}:\\ \\sup = 13,\\ \\inf\\ ${noneText}`,
  `\\{x \\mid x \\ge -11\\}:\\ \\sup\\ ${noneText},\\ \\inf = -11`,
  '\\left\\{\\tfrac{n+1}{n}\\right\\}_{n=1}^{50}:\\ \\sup = 2,\\ \\inf = \\tfrac{51}{50}',
  '\\left\\{\\tfrac{n-1}{n+1}\\right\\}_{n=1}^{100}:\\ \\sup = \\tfrac{99}{101},\\ \\inf = 0',
  '\\left\\{\\tfrac{3}{n+2}\\right\\}_{n=1}^{\\infty}:\\ \\sup = 1,\\ \\inf = 0',
  '\\left\\{\\tfrac{3-n}{3+n}\\right\\}_{n=3}^{\\infty}:\\ \\sup = 0,\\ \\inf = -1',
]
const footnoteClass = 'mt-4.5 text-[15px] text-muted'
const cellClass = 'border-t border-dashed border-faint py-2.5 pr-4 align-middle text-[15px]'

function decimalParts(value: number) {
  const digits = Math.abs(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  return { negative: value < -1e-9, digits }
}

export function SupremumInfimumPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.supremumInfimum' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('supremumInfimum')
  const [group, setGroup] = useState<GroupKey>('bounds')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [values, setValues] = useState<Partial<Record<string, number>>>({})
  const [delay, setDelay] = useState(1.5)

  const sampleKey = groupSamples[group][exampleIndex]
  const sample = samples[sampleKey]
  const total = groupSteps[group]
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const reached = (index: number) => current === null || current >= index
  const localize = (tex: string) => tex.replaceAll(decimalText, t('words.decimal')).replaceAll(noneText, `\\text{${t('words.none')}}`)
  const valueOf = (name: VariableName) => values[`${sampleKey}.${name}`] ?? sample.start[name] ?? 0

  function labelOf(of: Sample, value: number) {
    if (!of.view.decimals) return numberLabel(value)
    const { negative, digits } = decimalParts(value)
    return `${negative ? '−' : ''}${digits.replace('.', t('words.decimalMark'))}`
  }

  function texOf(of: Sample, value: number) {
    if (!of.view.decimals) return numberTex(value)
    const { negative, digits } = decimalParts(value)
    return `${negative ? '-' : ''}${digits.replace('.', t('words.decimal'))}`
  }

  const witnessTex = (witness: Witness) => (witness.n !== null && sample.termTex ? sample.termTex(witness.n) : texOf(sample, witness.value))
  const witnessLabel = (witness: Witness) => (witness.n !== null && sample.termLabel ? sample.termLabel(witness.n) : labelOf(sample, witness.value))

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

  function boundRow(kind: 'upper' | 'lower', bestShown: boolean): BoundsRow {
    const value = kind === 'upper' ? supremumOf(sample.set) : infimumOf(sample.set)
    const best =
      bestShown && value !== null
        ? {
            member: inBoundedSet(sample.set, value),
            label: (
              <>
                {kind === 'upper' ? 'sup ' : 'inf '}
                <SvgMathName name={sample.svgName} /> = {labelOf(sample, value)}
              </>
            ),
          }
        : null
    return { kind, title: t(`rows.${kind}`), noneText: t('words.none'), value, best }
  }

  function setCaption() {
    return t(sample.set.kind === 'sequence' ? 'steps.sequenceSet' : 'steps.intervalSet', { set: sample.setTex })
  }

  function stamp(kind: 'sup' | 'inf', value: number | null, shown: boolean) {
    const head = `\\${kind}\\ ${sample.name}`
    if (!shown) {
      return (
        <Stamp tone="pending">
          <MathTex tex={`${head} = ?`} />
        </Stamp>
      )
    }
    if (value === null) {
      return (
        <Stamp tone="flip">
          <MathTex tex={head} /> {t('words.none')}
        </Stamp>
      )
    }
    return (
      <Stamp tone="yes">
        <MathTex tex={`${head} = ${texOf(sample, value)}`} />
      </Stamp>
    )
  }

  function boundsView() {
    const b = valueOf('b')
    const a = valueOf('a')
    const above = memberAbove(sample.set, b)
    const below = memberBelow(sample.set, a)
    const bTex = texOf(sample, b)
    const aTex = texOf(sample, a)
    const name = sample.name
    const sup = supremumOf(sample.set)
    const inf = infimumOf(sample.set)
    const rows: StepTableRow[] = [
      {
        key: 'upper',
        tex: `b = ${bTex}:\\ b \\ge x,\\ \\forall x \\in ${name}`,
        reason: above ? t('reasons.upperFails', { x: texOf(sample, above.value), name, b: bTex }) : t('reasons.upperHolds', { name }),
        flip: above !== null,
        testTex: '',
        holds: above === null,
        visible: reached(1),
        now: current === 1,
      },
      {
        key: 'lower',
        tex: `a = ${aTex}:\\ a \\le x,\\ \\forall x \\in ${name}`,
        reason: below ? t('reasons.lowerFails', { x: texOf(sample, below.value), name, a: aTex }) : t('reasons.lowerHolds', { name }),
        flip: below !== null,
        testTex: '',
        holds: below === null,
        visible: reached(2),
        now: current === 2,
      },
    ]
    const probes: BoundsProbe[] = []
    const witnesses: BoundsWitness[] = []
    if (reached(1)) {
      probes.push({ name: 'b', value: b, label: `b = ${labelOf(sample, b)}`, raised: false })
      if (above) witnesses.push({ side: 'above', value: above.value, label: `x = ${labelOf(sample, above.value)}` })
    }
    if (reached(2)) {
      probes.push({ name: 'a', value: a, label: `a = ${labelOf(sample, a)}`, raised: true })
      if (below) witnesses.push({ side: 'below', value: below.value, label: `x = ${labelOf(sample, below.value)}` })
    }
    const upperRange = sup === null ? t('words.none') : `$[${texOf(sample, sup)}, \\infty)$`
    const lowerRange = inf === null ? t('words.none') : `$(-\\infty, ${texOf(sample, inf)}]$`
    return {
      equation: <MathTex tex={sample.setTex} className="text-[1.35em]" />,
      rows,
      figure: { probes, witnesses, rows: reached(3) ? [boundRow('upper', false), boundRow('lower', false)] : [], lit: [] },
      captions: [
        setCaption(),
        t(above ? 'steps.upperFails' : 'steps.upperHolds', { b: bTex }),
        t(below ? 'steps.lowerFails' : 'steps.lowerHolds', { a: aTex }),
        t('steps.allBounds', { upper: upperRange, lower: lowerRange }),
      ],
      reading: t('reading.joined', {
        first: t(above ? 'reading.upperFails' : 'reading.upperHolds', { b: bTex, name }),
        second: t(below ? 'reading.lowerFails' : 'reading.lowerHolds', { a: aTex, name }),
      }),
    }
  }

  function supInfView() {
    const y = valueOf('y')
    const above = memberAbove(sample.set, y)
    const below = memberBelow(sample.set, y)
    const yTex = texOf(sample, y)
    const name = sample.name
    const sup = supremumOf(sample.set)
    const inf = infimumOf(sample.set)
    const rows: StepTableRow[] = [
      {
        key: 'above',
        tex: `y = ${yTex}:\\ \\exists x \\in ${name},\\ y < x`,
        reason: above ? t('reasons.aboveFound', { x: witnessTex(above) }) : t('reasons.aboveNone'),
        flip: false,
        testTex: '',
        holds: above !== null,
        visible: reached(2),
        now: current === 2,
      },
      {
        key: 'below',
        tex: `y = ${yTex}:\\ \\exists x \\in ${name},\\ x < y`,
        reason: below ? t('reasons.belowFound', { x: witnessTex(below) }) : t('reasons.belowNone'),
        flip: false,
        testTex: '',
        holds: below !== null,
        visible: reached(4),
        now: current === 4,
      },
    ]
    const witnesses: BoundsWitness[] = []
    if (above && reached(2)) witnesses.push({ side: 'above', value: above.value, label: `x = ${witnessLabel(above)}` })
    if (below && reached(4)) witnesses.push({ side: 'below', value: below.value, label: `x = ${witnessLabel(below)}` })
    const figureRows: BoundsRow[] = []
    if (reached(1)) figureRows.push(boundRow('upper', reached(2)))
    if (reached(3)) figureRows.push(boundRow('lower', reached(4)))
    const lit = [reached(2) ? sup : null, reached(4) ? inf : null].filter((value): value is number => value !== null)
    const memberKey = (value: number, kind: 'sup' | 'inf') => {
      const member = inBoundedSet(sample.set, value)
      if (kind === 'sup') return member ? 'steps.supMember' : 'steps.supOutside'
      return member ? 'steps.infMember' : 'steps.infOutside'
    }
    return {
      equation: (
        <>
          <MathTex tex={sample.setTex} className="text-[1.35em]" />
          {stamp('sup', sup, reached(2))}
          {stamp('inf', inf, reached(4))}
        </>
      ),
      rows,
      figure: { probes: [{ name: 'y', value: y, label: `y = ${labelOf(sample, y)}`, raised: false }], witnesses, rows: figureRows, lit },
      captions: [
        setCaption(),
        sup === null ? t('steps.noUppers') : t('steps.uppers', { name, range: `[${texOf(sample, sup)}, \\infty)` }),
        sup === null ? t('steps.noSup', { name }) : t(memberKey(sup, 'sup'), { name, value: texOf(sample, sup) }),
        inf === null ? t('steps.noLowers') : t('steps.lowers', { name, range: `(-\\infty, ${texOf(sample, inf)}]` }),
        inf === null ? t('steps.noInf', { name }) : t(memberKey(inf, 'inf'), { name, value: texOf(sample, inf) }),
      ],
      reading: t('reading.joined', {
        first: above ? t('reading.aboveFound', { y: yTex, x: witnessTex(above) }) : t('reading.aboveNone', { y: yTex }),
        second: below ? t('reading.belowFound', { x: witnessTex(below) }) : t('reading.belowNone'),
      }),
    }
  }

  const view = group === 'bounds' ? boundsView() : supInfView()

  function manyCard() {
    const sup = supremumOf(sample.set)
    const inf = infimumOf(sample.set)
    const list = (start: number, direction: number) => `${[0, 1, 2, 3].map((offset) => texOf(sample, start + direction * offset)).join(',\\ ')},\\ \\dots`
    const content = (value: number | null, direction: number) =>
      value === null ? <span className="text-muted">{t('words.none')}</span> : <MathTex tex={list(value, direction)} />
    return (
      <TitledCard title={t('cards.many')}>
        <LabelledRows
          lines={[
            { key: 'upper', label: t('rows.upper'), content: content(sup, 1) },
            { key: 'lower', label: t('rows.lower'), content: content(inf, -1) },
          ]}
        />
        <p className={footnoteClass}>{t('many.footnote')}</p>
      </TitledCard>
    )
  }

  function memberCard() {
    const line = (name: 'a' | 'b') => {
      const value = valueOf(name)
      const bound = name === 'b' ? isUpperBound(sample.set, value) : isLowerBound(sample.set, value)
      const member = inBoundedSet(sample.set, value)
      const remark = bound ? (member ? 'member.boundMember' : 'member.boundOutside') : 'member.notBound'
      return {
        key: name,
        label: <MathTex tex={`${name} = ${texOf(sample, value)}`} />,
        content: (
          <>
            <MathTex tex={`${texOf(sample, value)} ${member ? '\\in' : '\\notin'} ${sample.name}`} />
            <span data-member-remark={name} className="ml-3 text-[15px] text-muted">
              {t(remark)}
            </span>
          </>
        ),
      }
    }
    return (
      <TitledCard title={t('cards.member')}>
        <LabelledRows lines={[line('b'), line('a')]} />
        <p className={footnoteClass}>{t('member.footnote')}</p>
      </TitledCard>
    )
  }

  function membershipCard() {
    const cell = (of: Sample, value: number | null) =>
      value === null ? (
        <span className="text-muted">{t('words.none')}</span>
      ) : (
        <MathTex tex={`${texOf(of, value)}\\ ${inBoundedSet(of.set, value) ? '\\in' : '\\notin'}\\ ${of.name}`} />
      )
    return (
      <TitledCard title={t('cards.membership')}>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-hand text-[21px] leading-tight font-bold">
                <th className="pr-4 pb-2 pl-2">{t('membership.set')}</th>
                <th className="pr-4 pb-2">sup</th>
                <th className="pr-4 pb-2">inf</th>
              </tr>
            </thead>
            <tbody>
              {groupSamples[group].map((key) => {
                const of = samples[key]
                const active = key === sampleKey
                return (
                  <tr key={key} data-membership={key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                    <td className={`${cellClass} pl-2`}>
                      <MathTex tex={of.name} />
                    </td>
                    {[supremumOf(of.set), infimumOf(of.set)].map((value, index) => (
                      <td
                        key={index}
                        data-bound={index === 0 ? 'sup' : 'inf'}
                        data-value={value ?? 'none'}
                        data-member={value === null ? undefined : inBoundedSet(of.set, value)}
                        className={`${cellClass} whitespace-nowrap`}
                      >
                        {cell(of, value)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {group === 'sequences' && (
          <p className={footnoteClass}>
            <MathText text={t('membership.footnote')} />
          </p>
        )}
      </TitledCard>
    )
  }

  function remarkedCard(title: string, formulas: string[], remarksKey: 'completeness.remarks' | 'unique.remarks', footnote: string) {
    const remarks = t(remarksKey, { returnObjects: true }) as string[]
    return (
      <TitledCard title={title}>
        <FormulaList items={formulas.map((tex, index) => ({ key: tex, tex: localize(tex), remark: localize(remarks[index]) }))} />
        <p className={footnoteClass}>
          <MathText text={footnote} />
        </p>
      </TitledCard>
    )
  }

  function othersCard() {
    return (
      <TitledCard title={t('cards.others')}>
        <div className="grid gap-3">
          {otherExamples.map((tex) => (
            <p key={tex} data-formula-item className="overflow-x-auto overflow-y-hidden">
              <MathTex tex={localize(tex)} />
            </p>
          ))}
        </div>
        <p className={footnoteClass}>{t('others.footnote')}</p>
      </TitledCard>
    )
  }

  function rulesCard() {
    const lit = new Set<RuleKey>(groupRules[group])
    return (
      <TitledCard title={t('cards.rules')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-hand text-[21px] leading-tight font-bold">
                <th className="pr-4 pb-3 pl-2">{t('rules.name')}</th>
                <th className="pr-4 pb-3">{t('rules.formula')}</th>
              </tr>
            </thead>
            <tbody>
              {ruleKeys.map((key) => {
                const active = lit.has(key)
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
      </TitledCard>
    )
  }

  function groupCards() {
    if (group === 'bounds') return [manyCard(), memberCard()]
    const membership = membershipCard()
    if (group === 'supInf') {
      return [membership, remarkedCard(t('cards.completeness'), completenessFormulas, 'completeness.remarks', t('completeness.footnote'))]
    }
    return [membership, remarkedCard(t('cards.unique'), uniqueFormulas, 'unique.remarks', t('unique.footnote')), othersCard()]
  }

  const axis = <line x1={2} x2={42} y1={11} y2={11} strokeWidth={1.6} className="stroke-ink" />
  const guide = <line x1={2} x2={42} y1={11} y2={11} strokeWidth={1.2} className="stroke-faint" />
  const legendIcons: Record<LegendKey, ReactNode> = {
    set: (
      <>
        <rect x={6} y={5} width={32} height={12} className="fill-highlight" />
        {axis}
        <line x1={6} x2={38} y1={11} y2={11} strokeWidth={4} className="stroke-ink" />
      </>
    ),
    sequence: (
      <>
        {axis}
        <circle cx={10} cy={11} r={4} className="fill-ink" />
        <circle cx={24} cy={11} r={3} className="fill-ink" />
        <circle cx={34} cy={11} r={2.4} className="fill-ink opacity-45" />
      </>
    ),
    probe: <path d="M15 4 h14 l-7 12 z" className="fill-ink" />,
    witness: (
      <>
        {axis}
        <circle cx={22} cy={11} r={5} className="fill-marker" />
      </>
    ),
    bounds: <line x1={6} x2={38} y1={11} y2={11} strokeWidth={5} className="stroke-ink opacity-55" />,
    bestMember: (
      <>
        {guide}
        <circle cx={22} cy={11} r={6} strokeWidth={2.6} className="fill-marker stroke-marker" />
      </>
    ),
    bestOutside: (
      <>
        {guide}
        <circle cx={22} cy={11} r={6} strokeWidth={2.6} className="fill-paper stroke-marker" />
      </>
    ),
  }

  const variables = groupVariables[group]

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
            {view.equation}
          </div>
          <BoundsLineBoard
            set={sample.set}
            view={sample.view}
            setName={sample.svgName}
            probes={view.figure.probes}
            witnesses={view.figure.witnesses}
            rows={view.figure.rows}
            litLabels={view.figure.lit}
            ariaLabel={t('aria.line')}
          />
          {variables.map((name) => {
            const variable = <i className="font-math-italic">{name}</i>
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
                    {variable} = {labelOf(sample, valueOf(name))}
                  </>
                }
                min={sample.view.min}
                max={sample.view.max}
                step={sample.view.step}
                value={valueOf(name)}
                disabled={false}
                onChange={(next) => move(name, next)}
              />
            )
          })}
          <div className="mt-3">
            <InequalityStepsTable rows={view.rows} stepHeader={t('table.check')} testHeader="" verdicts={{ holds: t('table.holds'), fails: t('table.fails') }} />
          </div>
          <p data-reading className="mt-2.5 min-h-[1.6em] text-[17px] [&_.katex]:text-[1.15em]!">
            <MathText text={view.reading} />
          </p>
        </TitledCard>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={current !== null && <MathText text={view.captions[current]} />}
          idleText={t(group === 'bounds' ? 'idle.ab' : 'idle.y')}
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
