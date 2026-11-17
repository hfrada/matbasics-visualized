import { Fragment, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { Stamp } from '../components/atoms/Stamp'
import { TabButton } from '../components/atoms/TabButton'
import { Title } from '../components/atoms/Title'
import { FormulaList } from '../components/molecules/FormulaList'
import { LabelledRows } from '../components/molecules/LabelledRows'
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
import { MirrorLineBoard } from '../components/organisms/MirrorLineBoard'
import { SolutionLineBoard } from '../components/organisms/SolutionLineBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { TriangleArrowsBoard } from '../components/organisms/TriangleArrowsBoard'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  absolute,
  chain,
  evaluateAlternatives,
  inSolutionSet,
  type Polynomial,
  type Relation,
  type RelationChain,
  type SolutionEnd,
  type SolutionInterval,
  type SolutionSet,
} from '../lib/inequality'
import { numberLabel, numberTex } from '../lib/numberLabel'

type GroupKey = 'definition' | 'equation' | 'theorem' | 'inequality' | 'properties'
type DefinitionKey = 'definitionPositive' | 'definitionZero' | 'definitionNegative' | 'definitionFraction'
type EquationKey = 'equationConstant' | 'equationVariable' | 'equationBoth'
type TheoremKey = 'theoremLess' | 'theoremGreater' | 'theoremLessEqual' | 'theoremGreaterEqual'
type InequalityKey = 'inequalityA' | 'inequalityB' | 'inequalityC' | 'inequalityD' | 'inequalityE' | 'inequalityF'
type PropertyKey = 'sameSign' | 'oppositeSign' | 'bothNegative'
type StepSampleKey = EquationKey | TheoremKey | InequalityKey
type SampleKey = DefinitionKey | StepSampleKey | PropertyKey
type VariableName = 'a' | 'b' | 'x'
type RuleKey = 'definition' | 'root' | 'theoremA' | 'theoremB' | 'corollaryA' | 'corollaryB' | 'product' | 'quotient' | 'triangle' | 'difference'
type ReasonKey = 'open' | 'sameOrOpposite' | 'subtract' | 'add' | 'addEach' | 'gather' | 'divide' | 'divideCoefficient' | 'candidates' | 'condition' | 'simplify'
type Reason = { key: ReasonKey; term: string } | { rule: RuleKey }
type StepRow = { tex: string; reason: Reason | null; test: RelationChain[]; warn: boolean }
type StepSample = {
  chip: string
  start: number
  rows: StepRow[]
  set: SolutionSet
  answer: string
  rules: RuleKey[]
  substitution: string
  rejected: number[]
  distance: number | null
  relation: Relation | null
  loose: boolean
}
type LegendKey =
  | 'point'
  | 'mirrorPoint'
  | 'mirror'
  | 'distance'
  | 'solution'
  | 'rejected'
  | 'set'
  | 'closed'
  | 'open'
  | 'probeIn'
  | 'probeOut'
  | 'arrow'
  | 'end'
  | 'gap'

const groupKeys: GroupKey[] = ['definition', 'equation', 'theorem', 'inequality', 'properties']
const groupSamples: Record<GroupKey, SampleKey[]> = {
  definition: ['definitionPositive', 'definitionZero', 'definitionNegative', 'definitionFraction'],
  equation: ['equationConstant', 'equationVariable', 'equationBoth'],
  theorem: ['theoremLess', 'theoremGreater', 'theoremLessEqual', 'theoremGreaterEqual'],
  inequality: ['inequalityA', 'inequalityB', 'inequalityC', 'inequalityD', 'inequalityE', 'inequalityF'],
  properties: ['sameSign', 'oppositeSign', 'bothNegative'],
}
const groupRanges: Record<GroupKey, { variables: VariableName[]; min: number; max: number; step: number }> = {
  definition: { variables: ['a'], min: -6, max: 6, step: 0.5 },
  equation: { variables: ['x'], min: -6, max: 6, step: 0.25 },
  theorem: { variables: ['x'], min: -6, max: 6, step: 0.5 },
  inequality: { variables: ['x'], min: -6, max: 12, step: 0.5 },
  properties: { variables: ['a', 'b'], min: -6, max: 6, step: 1 },
}
const delays = [0.5, 1, 1.5, 2, 3]
const orText = '\\text{or}'
const notText = '\\text{not}'
const decimalText = '{,}'
const or = `\\ ${orText}\\ `
const x: Polynomial = [0, 1]

const row = (tex: string, reason: Reason | null, ...test: RelationChain[]): StepRow => ({ tex, reason, test, warn: false })
const step = (key: ReasonKey, term = ''): Reason => ({ key, term })
const rule = (key: RuleKey): Reason => ({ rule: key })
const open = (at: number): SolutionEnd => ({ at, closed: false })
const closed = (at: number): SolutionEnd => ({ at, closed: true })
const interval = (low: SolutionEnd | null, high: SolutionEnd | null): SolutionInterval => ({ kind: 'interval', low, high })
const union = (...parts: SolutionInterval[]): SolutionSet => ({ kind: 'union', parts })
const points = (...values: number[]): SolutionSet => ({ kind: 'points', values })
const stepSample = (fields: Pick<StepSample, 'chip' | 'start' | 'rows' | 'set' | 'answer' | 'rules'> & Partial<StepSample>): StepSample => ({
  substitution: '',
  rejected: [],
  distance: null,
  relation: null,
  loose: false,
  ...fields,
})

const definitionSamples: Record<DefinitionKey, { chip: string; start: number }> = {
  definitionPositive: { chip: 'a = 3', start: 3 },
  definitionZero: { chip: 'a = 0', start: 0 },
  definitionNegative: { chip: 'a = -2', start: -2 },
  definitionFraction: { chip: 'a = -2\\tfrac{1}{2}', start: -2.5 },
}

const propertySamples: Record<PropertyKey, { chip: string; start: { a: number; b: number } }> = {
  sameSign: { chip: 'a = 2,\\ b = 3', start: { a: 2, b: 3 } },
  oppositeSign: { chip: 'a = 2,\\ b = -5', start: { a: 2, b: -5 } },
  bothNegative: { chip: 'a = -4,\\ b = -2', start: { a: -4, b: -2 } },
}

const conditionRow: StepRow = { ...row('x - 4 \\ge 0', step('condition'), chain([-4, 1], '>=', [0])), warn: true }

const stepSamples: Record<StepSampleKey, StepSample> = {
  equationConstant: stepSample({
    chip: '\\lvert 4x + 3 \\rvert = 7',
    start: 1,
    rows: [
      row('\\lvert 4x + 3 \\rvert = 7', null, chain(absolute([3, 4]), '=', [7])),
      row(`4x + 3 = 7${or}4x + 3 = -7`, step('open'), chain([3, 4], '=', [7]), chain([3, 4], '=', [-7])),
      row(`4x = 4${or}4x = -10`, step('subtract', '3'), chain([0, 4], '=', [4]), chain([0, 4], '=', [-10])),
      row(`x = 1${or}x = -\\tfrac{10}{4}`, step('divide', '4'), chain(x, '=', [1]), chain(x, '=', [-2.5])),
    ],
    set: points(-2.5, 1),
    answer: '\\{-\\tfrac{10}{4}, 1\\}',
    rules: ['definition'],
    substitution: 'A = 4x + 3,\\ c = 7',
  }),
  equationVariable: stepSample({
    chip: '\\lvert 7x \\rvert = x - 4',
    start: 0.5,
    rows: [
      row('\\lvert 7x \\rvert = x - 4', null, chain(absolute([0, 7]), '=', [-4, 1])),
      row(`7x = x - 4${or}7x = -(x - 4)`, step('open'), chain([0, 7], '=', [-4, 1]), chain([0, 7], '=', [4, -1])),
      row(`6x = -4${or}8x = 4`, step('gather'), chain([0, 6], '=', [-4]), chain([0, 8], '=', [4])),
      row(`x = -\\tfrac{4}{6}${or}x = \\tfrac{4}{8}`, step('candidates'), chain(x, '=', [-4 / 6]), chain(x, '=', [0.5])),
      conditionRow,
    ],
    set: { kind: 'empty' },
    answer: '\\varnothing',
    rules: ['definition'],
    substitution: 'A = 7x,\\ c = x - 4',
    rejected: [-4 / 6, 0.5],
    loose: true,
  }),
  equationBoth: stepSample({
    chip: '\\lvert 5x - 3 \\rvert = \\lvert 3x + 5 \\rvert',
    start: 4,
    rows: [
      row('\\lvert 5x - 3 \\rvert = \\lvert 3x + 5 \\rvert', null, chain(absolute([-3, 5]), '=', absolute([5, 3]))),
      row(`5x - 3 = 3x + 5${or}5x - 3 = -(3x + 5)`, step('sameOrOpposite'), chain([-3, 5], '=', [5, 3]), chain([-3, 5], '=', [-5, -3])),
      row(`2x = 8${or}8x = -2`, step('gather'), chain([0, 2], '=', [8]), chain([0, 8], '=', [-2])),
      row(`x = 4${or}x = -\\tfrac{2}{8}`, step('divideCoefficient'), chain(x, '=', [4]), chain(x, '=', [-0.25])),
    ],
    set: points(-0.25, 4),
    answer: '\\{-\\tfrac{2}{8}, 4\\}',
    rules: ['definition'],
    substitution: 'A = 5x - 3,\\ B = 3x + 5',
  }),
  theoremLess: stepSample({
    chip: '\\lvert x \\rvert < 3',
    start: 2,
    rows: [row('\\lvert x \\rvert < 3', null, chain(absolute(x), '<', [3])), row('-3 < x < 3', rule('theoremA'), chain([-3], '<', x, '<', [3]))],
    set: interval(open(-3), open(3)),
    answer: '(-3, 3)',
    rules: ['theoremA'],
    distance: 3,
    relation: '<',
  }),
  theoremGreater: stepSample({
    chip: '\\lvert x \\rvert > 3',
    start: 4,
    rows: [row('\\lvert x \\rvert > 3', null, chain(absolute(x), '>', [3])), row(`x < -3${or}x > 3`, rule('theoremB'), chain(x, '<', [-3]), chain(x, '>', [3]))],
    set: union(interval(null, open(-3)), interval(open(3), null)),
    answer: '(-\\infty, -3) \\cup (3, \\infty)',
    rules: ['theoremB'],
    distance: 3,
    relation: '>',
  }),
  theoremLessEqual: stepSample({
    chip: '\\lvert x \\rvert \\le 3',
    start: 3,
    rows: [row('\\lvert x \\rvert \\le 3', null, chain(absolute(x), '<=', [3])), row('-3 \\le x \\le 3', rule('corollaryA'), chain([-3], '<=', x, '<=', [3]))],
    set: interval(closed(-3), closed(3)),
    answer: '[-3, 3]',
    rules: ['corollaryA'],
    distance: 3,
    relation: '<=',
  }),
  theoremGreaterEqual: stepSample({
    chip: '\\lvert x \\rvert \\ge 3',
    start: 3,
    rows: [
      row('\\lvert x \\rvert \\ge 3', null, chain(absolute(x), '>=', [3])),
      row(`x \\le -3${or}x \\ge 3`, rule('corollaryB'), chain(x, '<=', [-3]), chain(x, '>=', [3])),
    ],
    set: union(interval(null, closed(-3)), interval(closed(3), null)),
    answer: '(-\\infty, -3] \\cup [3, \\infty)',
    rules: ['corollaryB'],
    distance: 3,
    relation: '>=',
  }),
  inequalityA: stepSample({
    chip: '\\lvert x - 4 \\rvert < 7',
    start: 0,
    rows: [
      row('\\lvert x - 4 \\rvert < 7', null, chain(absolute([-4, 1]), '<', [7])),
      row('-7 < x - 4 < 7', rule('theoremA'), chain([-7], '<', [-4, 1], '<', [7])),
      row('-7 + 4 < x - 4 + 4 < 7 + 4', step('addEach', '4'), chain([-3], '<', x, '<', [11])),
      row('-3 < x < 11', step('simplify'), chain([-3], '<', x, '<', [11])),
    ],
    set: interval(open(-3), open(11)),
    answer: '(-3, 11)',
    rules: ['theoremA'],
    substitution: 'x \\to x - 4,\\quad a = 7',
  }),
  inequalityB: stepSample({
    chip: '\\lvert 2x - 5 \\rvert < 3',
    start: 2,
    rows: [
      row('\\lvert 2x - 5 \\rvert < 3', null, chain(absolute([-5, 2]), '<', [3])),
      row('-3 < 2x - 5 < 3', rule('theoremA'), chain([-3], '<', [-5, 2], '<', [3])),
      row('2 < 2x < 8', step('addEach', '5'), chain([2], '<', [0, 2], '<', [8])),
      row('1 < x < 4', step('divide', '2'), chain([1], '<', x, '<', [4])),
    ],
    set: interval(open(1), open(4)),
    answer: '(1, 4)',
    rules: ['theoremA'],
    substitution: 'x \\to 2x - 5,\\quad a = 3',
  }),
  inequalityC: stepSample({
    chip: '\\lvert x - 3 \\rvert > 5',
    start: -4,
    rows: [
      row('\\lvert x - 3 \\rvert > 5', null, chain(absolute([-3, 1]), '>', [5])),
      row(`x - 3 < -5${or}x - 3 > 5`, rule('theoremB'), chain([-3, 1], '<', [-5]), chain([-3, 1], '>', [5])),
      row(`x < -2${or}x > 8`, step('add', '3'), chain(x, '<', [-2]), chain(x, '>', [8])),
    ],
    set: union(interval(null, open(-2)), interval(open(8), null)),
    answer: '(-\\infty, -2) \\cup (8, \\infty)',
    rules: ['theoremB'],
    substitution: 'x \\to x - 3,\\quad a = 5',
  }),
  inequalityD: stepSample({
    chip: '\\lvert 3x - 7 \\rvert > 2',
    start: 0,
    rows: [
      row('\\lvert 3x - 7 \\rvert > 2', null, chain(absolute([-7, 3]), '>', [2])),
      row(`3x - 7 < -2${or}3x - 7 > 2`, rule('theoremB'), chain([-7, 3], '<', [-2]), chain([-7, 3], '>', [2])),
      row(`3x < 5${or}3x > 9`, step('add', '7'), chain([0, 3], '<', [5]), chain([0, 3], '>', [9])),
      row(`x < \\tfrac{5}{3}${or}x > 3`, step('divide', '3'), chain(x, '<', [5 / 3]), chain(x, '>', [3])),
    ],
    set: union(interval(null, open(5 / 3)), interval(open(3), null)),
    answer: '(-\\infty, \\tfrac{5}{3}) \\cup (3, \\infty)',
    rules: ['theoremB'],
    substitution: 'x \\to 3x - 7,\\quad a = 2',
  }),
  inequalityE: stepSample({
    chip: '\\lvert 3x - 2 \\rvert \\le 4',
    start: 1,
    rows: [
      row('\\lvert 3x - 2 \\rvert \\le 4', null, chain(absolute([-2, 3]), '<=', [4])),
      row('-4 \\le 3x - 2 \\le 4', rule('corollaryA'), chain([-4], '<=', [-2, 3], '<=', [4])),
      row('-2 \\le 3x \\le 6', step('addEach', '2'), chain([-2], '<=', [0, 3], '<=', [6])),
      row('-\\tfrac{2}{3} \\le x \\le 2', step('divide', '3'), chain([-2 / 3], '<=', x, '<=', [2])),
    ],
    set: interval(closed(-2 / 3), closed(2)),
    answer: '[-\\tfrac{2}{3}, 2]',
    rules: ['corollaryA'],
    substitution: 'x \\to 3x - 2,\\quad a = 4',
  }),
  inequalityF: stepSample({
    chip: '\\lvert 3x - 4 \\rvert \\ge 2',
    start: 3,
    rows: [
      row('\\lvert 3x - 4 \\rvert \\ge 2', null, chain(absolute([-4, 3]), '>=', [2])),
      row(`3x - 4 \\le -2${or}3x - 4 \\ge 2`, rule('corollaryB'), chain([-4, 3], '<=', [-2]), chain([-4, 3], '>=', [2])),
      row(`3x \\le 2${or}3x \\ge 6`, step('add', '4'), chain([0, 3], '<=', [2]), chain([0, 3], '>=', [6])),
      row(`x \\le \\tfrac{2}{3}${or}x \\ge 2`, step('divide', '3'), chain(x, '<=', [2 / 3]), chain(x, '>=', [2])),
    ],
    set: union(interval(null, closed(2 / 3)), interval(closed(2), null)),
    answer: '(-\\infty, \\tfrac{2}{3}] \\cup [2, \\infty)',
    rules: ['corollaryB'],
    substitution: 'x \\to 3x - 4,\\quad a = 2',
  }),
}

const ruleKeys: RuleKey[] = ['definition', 'root', 'theoremA', 'theoremB', 'corollaryA', 'corollaryB', 'product', 'quotient', 'triangle', 'difference']
const ruleFormulas: Record<RuleKey, string> = {
  definition: '\\lvert a \\rvert = \\begin{cases} a, & a \\ge 0 \\\\ -a, & a < 0 \\end{cases}',
  root: '\\sqrt{x^2} = \\lvert x \\rvert',
  theoremA: '\\lvert x \\rvert < a \\iff -a < x < a',
  theoremB: `\\lvert x \\rvert > a \\iff x < -a${or}x > a`,
  corollaryA: '\\lvert x \\rvert \\le a \\iff -a \\le x \\le a',
  corollaryB: `\\lvert x \\rvert \\ge a \\iff x \\le -a${or}x \\ge a`,
  product: '\\lvert ab \\rvert = \\lvert a \\rvert \\cdot \\lvert b \\rvert',
  quotient: '\\left\\lvert \\tfrac{a}{b} \\right\\rvert = \\tfrac{\\lvert a \\rvert}{\\lvert b \\rvert},\\ b \\ne 0',
  triangle: '\\lvert a + b \\rvert \\le \\lvert a \\rvert + \\lvert b \\rvert',
  difference: '\\lvert a - b \\rvert \\le \\lvert a \\rvert + \\lvert b \\rvert,\\quad \\lvert a \\rvert - \\lvert b \\rvert \\le \\lvert a - b \\rvert',
}
const ruleLines: Partial<Record<RuleKey, SolutionSet>> = {
  theoremA: interval(open(0), open(1)),
  theoremB: union(interval(null, open(0)), interval(open(1), null)),
  corollaryA: interval(closed(0), closed(1)),
  corollaryB: union(interval(null, closed(0)), interval(closed(1), null)),
}
const definitionRules: RuleKey[] = ['definition', 'root']
const propertyRules: RuleKey[] = ['triangle']

const caseFormulas = { nonnegative: '\\lvert a \\rvert = a', negative: '\\lvert a \\rvert = -a' }
const definitionExamples = [
  '\\lvert 124 \\rvert = 124',
  '\\lvert 2{,}223 \\rvert = 2{,}223',
  '\\lvert 0 \\rvert = 0',
  '\\lvert -0{,}021 \\rvert = -(-0{,}021) = 0{,}021',
  '\\lvert -2\\tfrac{1}{2} \\rvert = -(-2\\tfrac{1}{2}) = 2\\tfrac{1}{2}',
  '\\lvert 1{,}414213\\ldots \\rvert = 1{,}414213\\ldots',
  '\\lvert -\\sqrt{5} \\rvert = -(-\\sqrt{5}) = \\sqrt{5}',
  '\\lvert -421 \\rvert = -(-421) = 421',
]
const equationOthers = [
  `\\lvert 5x + 1 \\rvert = 2 \\;\\Rightarrow\\; x = \\tfrac{1}{5}${or}x = -\\tfrac{3}{5}`,
  `\\lvert 2x + 1 \\rvert = 5 \\;\\Rightarrow\\; x = 2${or}x = -3`,
  `\\lvert 5x - 1 \\rvert = 2 \\;\\Rightarrow\\; x = \\tfrac{3}{5}${or}x = -\\tfrac{1}{5}`,
  '\\lvert x \\rvert = -3',
]
const inequalityOthers = [
  '\\lvert 2x - 1 \\rvert < 5 \\;\\Rightarrow\\; -2 < x < 3',
  `\\lvert 4x - 8 \\rvert > 4 \\;\\Rightarrow\\; x < 1${or}x > 3`,
  '\\lvert 5x - 1 \\rvert \\le 2 \\;\\Rightarrow\\; -\\tfrac{1}{5} \\le x \\le \\tfrac{3}{5}',
  `\\lvert 4x + 8 \\rvert \\ge 6 \\;\\Rightarrow\\; x \\le -\\tfrac{7}{2}${or}x \\ge -\\tfrac{1}{2}`,
]
const conditionFormulas = ['\\lvert x \\rvert < 0', '\\lvert x \\rvert \\le 0', '\\lvert x \\rvert > -1']
const openingRules = {
  constant: `\\lvert A \\rvert = c \\iff A = c${or}A = -c`,
  both: `\\lvert A \\rvert = \\lvert B \\rvert \\iff A = B${or}A = -B`,
}
const relationTex: Record<Relation, string> = { '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge', '=': '=' }
const flippedRelation: Record<Relation, Relation> = { '<': '>', '<=': '>=', '>': '<', '>=': '<=', '=': '=' }
const legendKeys: Record<GroupKey, LegendKey[]> = {
  definition: ['point', 'mirrorPoint', 'mirror', 'distance'],
  equation: ['solution', 'rejected', 'probeIn', 'probeOut'],
  theorem: ['set', 'closed', 'open', 'distance', 'probeIn', 'probeOut'],
  inequality: ['set', 'closed', 'open', 'probeIn', 'probeOut'],
  properties: ['arrow', 'end', 'distance', 'gap'],
}

const isStepSample = (key: SampleKey): key is StepSampleKey => key in stepSamples
const isDefinitionSample = (key: SampleKey): key is DefinitionKey => key in definitionSamples
const paren = (value: number) => (value < 0 ? `(${numberTex(value)})` : numberTex(value))
const bars = (tex: string) => `\\lvert ${tex} \\rvert`
const footnoteClass = 'mt-4.5 text-[15px] text-muted'
const cellClass = 'border-t border-dashed border-faint py-3 pr-4 align-middle text-[15px] transition-opacity duration-300'

function startOf(key: SampleKey, name: VariableName) {
  if (isStepSample(key)) return stepSamples[key].start
  if (isDefinitionSample(key)) return definitionSamples[key].start
  return propertySamples[key].start[name === 'b' ? 'b' : 'a']
}

export function AbsoluteValuePage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.absoluteValue' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('absoluteValue')
  const [group, setGroup] = useState<GroupKey>('definition')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [values, setValues] = useState<Partial<Record<string, number>>>({})
  const [delay, setDelay] = useState(1.5)

  const sampleKey = groupSamples[group][exampleIndex]
  const range = groupRanges[group]
  const stepped = isStepSample(sampleKey) ? stepSamples[sampleKey] : null
  const total = stepped ? stepped.rows.length + 1 : 4
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const reached = (index: number) => current === null || current >= index
  const finished = current === null || current === total - 1
  const orWord = t('words.or')
  const localize = (tex: string) =>
    tex
      .replaceAll(orText, `\\text{${orWord}}`)
      .replaceAll(notText, `\\text{${t('words.not')}}`)
      .replaceAll(decimalText, t('words.decimal'))
  const valueOf = (name: VariableName) => values[`${sampleKey}.${name}`] ?? startOf(sampleKey, name)

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

  function chipOf(key: SampleKey) {
    if (isStepSample(key)) return stepSamples[key].chip
    if (isDefinitionSample(key)) return definitionSamples[key].chip
    return propertySamples[key].chip
  }

  function stamp(tex: string, tone: 'yes' | 'flip' = 'yes') {
    if (!finished) return <Stamp tone="pending">?</Stamp>
    return (
      <Stamp tone={tone}>
        <MathTex tex={tex} />
      </Stamp>
    )
  }

  function reasonText(reason: Reason) {
    if ('rule' in reason) return t(`rules.names.${reason.rule}`)
    return t(`reasons.${reason.key}`, { term: reason.term })
  }

  type BoardView = { equation: ReactNode; body: ReactNode; figure: ReactNode; reading: string; captions: string[] }

  function definitionView(): BoardView {
    const a = valueOf('a')
    const negative = a < 0
    const result = Math.abs(a)
    const caseKey = reached(1) ? (negative ? 'negative' : 'nonnegative') : null
    const absoluteTex = `${bars(numberTex(a))} = ${numberTex(result)}`
    let chainTex = bars(numberTex(a))
    if (negative) chainTex += ` = -${paren(a)}`
    if (reached(3) || !negative) chainTex += ` = ${numberTex(result)}`
    const captions = [
      t('definition.steps.point', { a: numberTex(a) }),
      t(negative ? 'definition.steps.caseNegative' : 'definition.steps.caseNonnegative'),
      negative ? t('definition.steps.mirror', { negation: `-${paren(a)} = ${numberTex(-a)}` }) : t('definition.steps.stay'),
      t('definition.steps.distance', { result: numberTex(result), absolute: absoluteTex }),
    ]
    return {
      equation: (
        <>
          <MathTex tex={`${bars(numberTex(a))} =`} className="[&_.katex]:text-[1.35em]!" />
          {stamp(numberTex(result))}
        </>
      ),
      body: (
        <>
          <table className="w-full border-collapse text-left">
            <tbody>
              {(['nonnegative', 'negative'] as const).map((key) => {
                const active = caseKey === key
                return (
                  <tr
                    key={key}
                    data-case={key}
                    data-active={active || undefined}
                    className={`transition-[background-color,opacity] duration-300 ${active ? 'bg-highlight-soft' : caseKey ? 'opacity-45' : ''}`}
                  >
                    <td className="border-t border-dashed border-faint py-2 pr-3.5 pl-2">
                      <MathTex tex={caseFormulas[key]} className="[&_.katex]:text-[1.1em]!" />
                    </td>
                    <td className="border-t border-dashed border-faint py-2 pr-3.5 text-[15px] text-muted">
                      <MathText text={t(`cases.${key}`)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p data-chain className={`mt-3 min-h-8 overflow-x-auto overflow-y-hidden ${reached(2) ? '' : 'invisible'}`}>
            <MathTex tex={chainTex} className="[&_.katex]:text-[1.2em]!" />
          </p>
        </>
      ),
      figure: <MirrorLineBoard a={a} mirrored={reached(2)} measured={reached(3)} ariaLabel={t('aria.definition')} />,
      reading:
        a === 0
          ? t('definition.readingZero')
          : t('definition.reading', { absolute: absoluteTex, a: numberTex(a), result: numberTex(result) }),
      captions,
    }
  }

  function stepsView(key: StepSampleKey, sample: StepSample): BoardView {
    const value = valueOf('x')
    const satisfied = inSolutionSet(sample.set, value)
    const tableRows: StepTableRow[] = sample.rows.map((item, index) => {
      const result = evaluateAlternatives(item.test, value, orWord)
      return {
        key: item.tex,
        tex: localize(item.tex),
        reason: item.reason ? reasonText(item.reason) : null,
        flip: item.warn,
        testTex: result.tex,
        holds: result.holds,
        visible: current === null || index <= current,
        now: current === index,
      }
    })
    function reading() {
      const name = numberTex(value)
      if (sample.loose) {
        if (tableRows[3].holds) return t('reading.falseCandidate', { x: name })
        if (tableRows[4].holds) return t('reading.conditionOnly', { x: name })
        return t('reading.never', { x: name })
      }
      return t(satisfied ? 'reading.inside' : 'reading.outside', { x: name })
    }
    return {
      equation: (
        <>
          <MathTex tex={localize(sample.rows[0].tex)} className="[&_.katex]:text-[1.35em]!" />
          {stamp(sample.answer, sample.loose ? 'flip' : 'yes')}
        </>
      ),
      body: (
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
      ),
      figure: (
        <SolutionLineBoard
          set={finished ? sample.set : null}
          x={value}
          satisfied={satisfied}
          ariaLabel={t('aria.line')}
          lo={range.min}
          hi={range.max}
          rejected={sample.rejected}
          distance={sample.distance}
        />
      ),
      reading: reading(),
      captions: t(`samples.${key}.steps`, { returnObjects: true }),
    }
  }

  function propertiesView(): BoardView {
    const a = valueOf('a')
    const b = valueOf('b')
    const sum = a + b
    const leftSide = Math.abs(sum)
    const rightSide = Math.abs(a) + Math.abs(b)
    const equal = leftSide === rightSide
    const why = t(`properties.why.${a === 0 || b === 0 ? 'zero' : a * b > 0 ? 'same' : 'opposite'}`)
    const sumTex = `\\lvert a + b \\rvert = \\lvert ${numberTex(a)} + ${paren(b)} \\rvert = ${bars(numberTex(sum))}${reached(1) ? ` = ${leftSide}` : ''}`
    const absoluteTex = `\\lvert a \\rvert + \\lvert b \\rvert = ${bars(numberTex(a))} + ${bars(numberTex(b))} = ${Math.abs(a)} + ${Math.abs(b)} = ${rightSide}`
    const sides = { left: String(leftSide), right: String(rightSide), why }
    return {
      equation: (
        <>
          <MathTex tex={ruleFormulas.triangle} className="[&_.katex]:text-[1.35em]!" />
          {stamp(`${leftSide} ${equal ? '=' : '<'} ${rightSide}`)}
        </>
      ),
      body: (
        <>
          <p data-chain="sum" className="mt-1 min-h-8 overflow-x-auto overflow-y-hidden">
            <MathTex tex={sumTex} className="[&_.katex]:text-[1.2em]!" />
          </p>
          <p data-chain="absolute" className={`mt-2 min-h-8 overflow-x-auto overflow-y-hidden ${reached(2) ? '' : 'invisible'}`}>
            <MathTex tex={absoluteTex} className="[&_.katex]:text-[1.2em]!" />
          </p>
        </>
      ),
      figure: (
        <TriangleArrowsBoard
          a={a}
          b={b}
          sumShown={reached(0)}
          sumMeasured={reached(1)}
          absoluteShown={reached(2)}
          gapShown={reached(3)}
          ariaLabel={t('aria.triangle')}
        />
      ),
      reading: t(`properties.reading.${equal ? 'equal' : 'less'}`, sides),
      captions: [
        t('properties.steps.sum', { a: numberTex(a), b: numberTex(b), sum: numberTex(sum) }),
        t('properties.steps.sumDistance', { absolute: bars(numberTex(sum)), left: String(leftSide) }),
        t('properties.steps.absolute', { a: String(Math.abs(a)), b: String(Math.abs(b)), right: String(rightSide) }),
        t(`properties.steps.${equal ? 'equal' : 'less'}`, sides),
      ],
    }
  }

  const view = stepped && isStepSample(sampleKey) ? stepsView(sampleKey, stepped) : group === 'definition' ? definitionView() : propertiesView()

  function examplesCard() {
    return (
      <TitledCard title={t('cards.examples')}>
        <div className="grid gap-3.5">
          {definitionExamples.map((tex) => (
            <p key={tex} data-formula-item className="overflow-x-auto overflow-y-hidden">
              <MathTex tex={localize(tex)} />
            </p>
          ))}
        </div>
        <p className={footnoteClass}>
          <MathText text={t('examplesFootnote')} />
        </p>
      </TitledCard>
    )
  }

  function rootCard() {
    const a = valueOf('a')
    const live = `\\sqrt{a^2} = \\sqrt{${paren(a)}^2} = \\sqrt{${numberTex(a * a)}} = ${numberTex(Math.abs(a))} = ${bars(numberTex(a))}`
    return (
      <TitledCard title={t('cards.root')}>
        <LabelledRows
          lines={[
            { key: 'live', label: <MathText text={t('labels.live')} />, content: <MathTex tex={live} /> },
            { key: 'square', label: t('labels.square'), content: <MathTex tex={localize(`x^2 = 16 \\;\\Rightarrow\\; x = 4${or}x = -4`)} /> },
            { key: 'root', label: t('labels.root'), content: <MathTex tex={localize(`\\sqrt{16} = 4,\\ ${notText}\\ \\pm 4`)} /> },
          ]}
        />
        <p className={footnoteClass}>
          <MathText text={t('rootFootnote')} />
        </p>
      </TitledCard>
    )
  }

  function substitutionCard(key: StepSampleKey, sample: StepSample, title: string, formula: string, footnote: string) {
    return (
      <TitledCard title={title}>
        <LabelledRows
          lines={[
            { key: 'rule', label: t('labels.rule'), content: <MathTex tex={localize(formula)} /> },
            { key: 'replace', label: t('labels.replace'), content: <MathTex tex={sample.substitution} /> },
            { key: 'result', label: t('labels.result'), content: <MathTex tex={localize(sample.rows[1].tex)} /> },
          ]}
        />
        <p data-substitution={key} className={footnoteClass}>
          <MathText text={footnote} />
        </p>
      </TitledCard>
    )
  }

  function othersCard(formulas: string[], remarks: string[]) {
    return (
      <TitledCard title={t('cards.others')}>
        <FormulaList items={formulas.map((tex, index) => ({ key: tex, tex: localize(tex), remark: remarks[index] }))} />
      </TitledCard>
    )
  }

  function casesCard(sample: StepSample) {
    const value = valueOf('x')
    const relation = sample.relation ?? '<'
    const active = value >= 0 ? 'nonnegative' : 'negative'
    const items = [
      { key: 'nonnegative', when: 'x \\ge 0', formula: '\\lvert x \\rvert = x', result: `x ${relationTex[relation]} 3` },
      {
        key: 'negative',
        when: 'x < 0',
        formula: '\\lvert x \\rvert = -x',
        result: `-x ${relationTex[relation]} 3 \\iff x ${relationTex[flippedRelation[relation]]} -3`,
      },
    ]
    const now = value >= 0 ? `${bars(numberTex(value))} = ${numberTex(value)}` : `${bars(numberTex(value))} = -${paren(value)} = ${numberTex(-value)}`
    return (
      <TitledCard title={t('cards.cases')}>
        <table className="w-full border-collapse text-left">
          <tbody>
            {items.map((item) => (
              <tr key={item.key} data-case={item.key} data-active={item.key === active || undefined} className={item.key === active ? 'bg-highlight-soft' : ''}>
                <th className={`${cellClass} pl-2 font-normal whitespace-nowrap`}>
                  <MathTex tex={item.when} />
                </th>
                <td className={cellClass}>
                  <MathTex tex={item.formula} />
                  <span className="mt-1 block text-muted">
                    <MathTex tex={item.result} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={footnoteClass}>
          <MathText text={t('casesFootnote', { now, joined: localize(sample.rows[1].tex) })} />
        </p>
      </TitledCard>
    )
  }

  function conditionCard() {
    const remarks = t('condition.remarks', { returnObjects: true })
    return (
      <TitledCard title={<MathText text={t('cards.condition')} />}>
        <FormulaList items={conditionFormulas.map((tex, index) => ({ key: tex, tex, remark: remarks[index] }))} />
        <p className={footnoteClass}>
          <MathText text={t('condition.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function liveCard() {
    const a = valueOf('a')
    const b = valueOf('b')
    const right = Math.abs(a) + Math.abs(b)
    const quotient =
      b === 0
        ? `b = 0:\\ \\text{${t('words.undefined')}}`
        : `\\left\\lvert \\tfrac{${numberTex(a)}}{${numberTex(b)}} \\right\\rvert = \\tfrac{${Math.abs(a)}}{${Math.abs(b)}} = \\tfrac{${bars(numberTex(a))}}{${bars(numberTex(b))}}`
    const lines = [
      { key: 'product', label: '(a)', tex: `\\lvert ${numberTex(a)} \\cdot ${paren(b)} \\rvert = ${Math.abs(a * b)} = ${Math.abs(a)} \\cdot ${Math.abs(b)}` },
      { key: 'quotient', label: '(b)', tex: quotient },
      { key: 'triangle', label: '(c)', tex: `\\lvert ${numberTex(a)} + ${paren(b)} \\rvert = ${Math.abs(a + b)} \\le ${right}` },
      { key: 'differenceA', label: t('live.corollaryA'), tex: `\\lvert ${numberTex(a)} - ${paren(b)} \\rvert = ${Math.abs(a - b)} \\le ${right}` },
      {
        key: 'differenceB',
        label: t('live.corollaryB'),
        tex: `${Math.abs(a)} - ${Math.abs(b)} = ${numberTex(Math.abs(a) - Math.abs(b))} \\le ${Math.abs(a - b)}`,
      },
    ]
    return (
      <TitledCard title={<MathText text={t('cards.live')} />}>
        <LabelledRows lines={lines.map((line) => ({ key: line.key, label: line.label, content: <MathTex tex={line.tex} /> }))} />
      </TitledCard>
    )
  }

  function proofCard() {
    const a = valueOf('a')
    const b = valueOf('b')
    const right = Math.abs(a) + Math.abs(b)
    const reasons = t('proof.reasons', { returnObjects: true })
    const lines = [
      ['-\\lvert a \\rvert \\le a \\le \\lvert a \\rvert', `${numberTex(-Math.abs(a))} \\le ${numberTex(a)} \\le ${Math.abs(a)}`],
      ['-\\lvert b \\rvert \\le b \\le \\lvert b \\rvert', `${numberTex(-Math.abs(b))} \\le ${numberTex(b)} \\le ${Math.abs(b)}`],
      ['-(\\lvert a \\rvert + \\lvert b \\rvert) \\le a + b \\le \\lvert a \\rvert + \\lvert b \\rvert', `${numberTex(-right)} \\le ${numberTex(a + b)} \\le ${right}`],
      [ruleFormulas.triangle, `${Math.abs(a + b)} \\le ${right}`],
    ]
    return (
      <TitledCard title={t('cards.proof')}>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <tbody>
              {lines.map(([formula, live], index) => (
                <tr key={formula} data-proof-row={index}>
                  <td className={`${cellClass} pl-2`}>
                    <MathTex tex={formula} />
                    <span className="mt-1 block text-sm text-muted">{reasons[index]}</span>
                  </td>
                  <td className={`${cellClass} whitespace-nowrap`}>
                    <MathTex tex={live} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={footnoteClass}>
          <MathText text={t('proof.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function rulesCard() {
    const lit = new Set<RuleKey>(stepped ? stepped.rules : group === 'definition' ? definitionRules : propertyRules)
    return (
      <TitledCard title={t('cards.rules')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-hand text-[21px] leading-tight font-bold">
                <th className="pr-4 pb-3 pl-2">{t('rules.name')}</th>
                <th className="pr-4 pb-3">{t('rules.formula')}</th>
                <th className="pr-4 pb-3">{t('rules.line')}</th>
              </tr>
            </thead>
            <tbody>
              {ruleKeys.map((key) => {
                const active = lit.has(key)
                const line = ruleLines[key]
                return (
                  <tr key={key} data-rule={key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                    <th className={`${cellClass} pl-2 font-normal whitespace-nowrap`}>{t(`rules.names.${key}`)}</th>
                    <td className={`${cellClass} whitespace-nowrap`}>
                      <MathTex tex={localize(ruleFormulas[key])} />
                    </td>
                    <td className={cellClass}>{line && <SolutionSchematic set={line} labels={null} width={96} />}</td>
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
    if (group === 'definition') return [examplesCard(), rootCard()]
    if (group === 'properties') return [liveCard(), proofCard()]
    if (!stepped || !isStepSample(sampleKey)) return []
    if (group === 'equation') {
      const formula = sampleKey === 'equationBoth' ? openingRules.both : openingRules.constant
      return [
        substitutionCard(sampleKey, stepped, t('cards.opening'), formula, t(`openingNotes.${sampleKey === 'equationBoth' ? 'both' : sampleKey === 'equationVariable' ? 'variable' : 'constant'}`)),
        othersCard(equationOthers, t('equationOthers', { returnObjects: true })),
      ]
    }
    if (group === 'theorem') return [casesCard(stepped), conditionCard()]
    return [
      substitutionCard(sampleKey, stepped, t('cards.swap'), ruleFormulas[stepped.rules[0]], t('swapFootnote')),
      othersCard(inequalityOthers, t('inequalityOthers', { returnObjects: true })),
    ]
  }

  const axis = <line x1={2} x2={42} y1={11} y2={11} strokeWidth={1.6} className="stroke-ink" />
  const probe = (tone: string) => <path d="M15 4 h14 l-7 12 z" className={tone} />
  const bracketIcon = <path d="M6 6 V14 H38 V6" strokeWidth={1.6} className="fill-none stroke-ink" />
  const legendIcons: Record<LegendKey, ReactNode> = {
    point: <>{axis}<circle cx={22} cy={11} r={5} className="fill-ink" /></>,
    mirrorPoint: <>{axis}<circle cx={22} cy={11} r={5} strokeWidth={2.2} className="fill-paper stroke-ink" /></>,
    mirror: <path d="M4 16 Q22 -2 40 16" strokeWidth={1.8} strokeDasharray="5 4" className="fill-none stroke-ink" />,
    distance: bracketIcon,
    solution: <>{axis}<circle cx={22} cy={11} r={5} className="fill-ink" /></>,
    rejected: (
      <>
        {axis}
        <path d="M16 5 L28 17 M16 17 L28 5" strokeWidth={2.6} strokeLinecap="round" className="stroke-marker" />
      </>
    ),
    set: (
      <>
        <rect x={6} y={5} width={32} height={12} className="fill-highlight" />
        {axis}
        <line x1={6} x2={38} y1={11} y2={11} strokeWidth={4} className="stroke-ink" />
      </>
    ),
    closed: <>{axis}<circle cx={22} cy={11} r={5} className="fill-ink" /></>,
    open: <>{axis}<circle cx={22} cy={11} r={5} strokeWidth={2.2} className="fill-paper stroke-ink" /></>,
    probeIn: probe('fill-ink'),
    probeOut: probe('fill-marker'),
    arrow: (
      <>
        <line x1={4} x2={32} y1={11} y2={11} strokeWidth={2.2} className="stroke-ink" />
        <path d="M40 11 l-11 -5.5 v11 z" className="fill-ink" />
      </>
    ),
    end: <>{axis}<circle cx={22} cy={11} r={5} className="fill-ink" /></>,
    gap: (
      <>
        {axis}
        <rect x={8} y={6} width={28} height={10} className="fill-marker opacity-40" />
      </>
    ),
  }

  const idleKey = range.variables.length === 2 ? 'idle.ab' : range.variables[0] === 'a' ? 'idle.a' : 'idle.x'

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
                <MathTex tex={chipOf(key)} className="[&_.katex]:text-[0.74em]!" />
              </TabButton>
            ))}
          </div>
        </>
      }
      board={
        <TitledCard title={t(`groups.${group}`)}>
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">{view.equation}</div>
          {view.body}
          <div className="mt-3">{view.figure}</div>
          {range.variables.map((name) => {
            const variable = <i className="font-math-italic">{name}</i>
            return (
              <PenSlider
                key={name}
                label={
                  <>
                    {t(stepped ? 'slider.test' : 'slider.move')} {variable}
                  </>
                }
                ariaLabel={t(`aria.slider.${name}`)}
                valueText={
                  <>
                    {variable} = {numberLabel(valueOf(name))}
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
          <p data-reading className="mt-2.5 min-h-[1.6em] text-[17px] [&_.katex]:text-[1.15em]!">
            <MathText text={view.reading} />
          </p>
        </TitledCard>
      }
      progress={
        <StepProgress total={total} current={current} caption={current !== null && <MathText text={view.captions[current]} />} idleText={t(idleKey)} />
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
