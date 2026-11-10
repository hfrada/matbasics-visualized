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
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { VennCheckBoard, type VennMark, type VennShape } from '../components/organisms/VennCheckBoard'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'

type ExampleKey = 'subset' | 'notSubset' | 'equal' | 'complement'

type ReasonKey =
  | 'inBoth'
  | 'onlyIn'
  | 'notChecked'
  | 'counter'
  | 'oneEnough'
  | 'allIn'
  | 'proper'
  | 'equal'
  | 'inSet'
  | 'inComplement'
  | 'outside'

type SymbolKey = 'member' | 'notMember' | 'subset' | 'proper' | 'notSubset' | 'complement' | 'suchThat'

type Reason = {
  key: ReasonKey
  x?: string
  a?: string
  b?: string
}

type Mark = VennMark & { value: number }

type CheckStep = {
  focus: number[]
  marks?: Mark[]
  glow?: number[]
  counter?: number
  reveal?: string
  shade?: boolean
  reasons: Reason[]
}

type Example = {
  label: string
  shapes: VennShape[]
  universe: boolean
  chips: { value: number; x: number; y: number }[]
  given: string[]
  results: { key: string; tex: string }[]
  symbols: SymbolKey[]
  steps: CheckStep[]
  explain: (value: number) => Reason[]
}

const symbolTex: Record<SymbolKey, string> = {
  member: '\\in',
  notMember: '\\notin',
  subset: '\\subseteq',
  proper: '\\subset',
  notSubset: '\\not\\subset',
  complement: 'A^C',
  suchThat: '\\mid',
}

const setB: VennShape = { name: 'B', cx: 320, cy: 200, rx: 220, ry: 140, labelX: 495, labelY: 92 }
const membersB = [1, 2, 3, 4, 5]

function mark(value: number, text: string, tone: VennMark['tone'], below = false): Mark {
  return { value, text, tone, below }
}

function checkStep(x: number, a: string, b: string, below = false): CheckStep {
  return {
    focus: [x],
    marks: [mark(x, `∈ ${b}`, 'ink', below)],
    reasons: [{ key: 'inBoth', x: `${x}`, a, b }],
  }
}

const examples: Record<ExampleKey, Example> = {
  subset: {
    label: 'A ⊆ B',
    shapes: [setB, { name: 'A', cx: 360, cy: 210, rx: 120, ry: 75, labelX: 452, labelY: 150 }],
    universe: false,
    chips: [
      { value: 1, x: 170, y: 150 },
      { value: 2, x: 300, y: 210 },
      { value: 3, x: 360, y: 185 },
      { value: 4, x: 420, y: 228 },
      { value: 5, x: 200, y: 272 },
    ],
    given: ['A=\\{2,3,4\\}', 'B=\\{1,2,3,4,5\\}'],
    results: [
      { key: 'subset', tex: 'A\\subseteq B' },
      { key: 'unequal', tex: 'A\\neq B' },
      { key: 'proper', tex: 'A\\subset B' },
    ],
    symbols: ['member', 'notMember', 'subset', 'proper'],
    steps: [
      checkStep(2, 'A', 'B'),
      checkStep(3, 'A', 'B'),
      checkStep(4, 'A', 'B'),
      { focus: [], reveal: 'subset', reasons: [{ key: 'allIn', a: 'A', b: 'B' }] },
      {
        focus: [1, 5],
        marks: [mark(1, '∉ A', 'marker'), mark(5, '∉ A', 'marker')],
        reveal: 'unequal',
        reasons: [{ key: 'onlyIn', x: '1, 5', a: 'A', b: 'B' }],
      },
      { focus: [], reveal: 'proper', reasons: [{ key: 'proper', a: 'A', b: 'B' }] },
    ],
    explain: (value) =>
      [2, 3, 4].includes(value)
        ? [{ key: 'inBoth', x: `${value}`, a: 'A', b: 'B' }]
        : [{ key: 'onlyIn', x: `${value}`, a: 'A', b: 'B' }],
  },
  notSubset: {
    label: 'D ⊄ B',
    shapes: [setB, { name: 'D', cx: 105, cy: 115, rx: 100, ry: 42, rotate: 45, labelX: 40, labelY: 178 }],
    universe: false,
    chips: [
      { value: 1, x: 150, y: 160 },
      { value: 2, x: 280, y: 200 },
      { value: 3, x: 360, y: 170 },
      { value: 4, x: 420, y: 240 },
      { value: 5, x: 300, y: 272 },
      { value: 6, x: 60, y: 70 },
    ],
    given: ['D=\\{1,6\\}', 'B=\\{1,2,3,4,5\\}'],
    results: [{ key: 'notSubset', tex: 'D\\not\\subset B' }],
    symbols: ['member', 'notMember', 'notSubset'],
    steps: [
      checkStep(1, 'D', 'B'),
      {
        focus: [6],
        marks: [mark(6, '∉ B', 'marker')],
        counter: 6,
        reveal: 'notSubset',
        reasons: [{ key: 'counter', x: '6', a: 'D', b: 'B' }, { key: 'oneEnough' }],
      },
    ],
    explain: (value) => {
      if (value === 1) return [{ key: 'inBoth', x: '1', a: 'D', b: 'B' }]
      if (value === 6) return [{ key: 'counter', x: '6', a: 'D', b: 'B' }]
      return [{ key: 'notChecked', x: `${value}`, a: 'D' }]
    },
  },
  equal: {
    label: 'B = C',
    shapes: [setB, { name: 'C', cx: 328, cy: 208, rx: 220, ry: 140, dashed: true, labelX: 500, labelY: 330 }],
    universe: false,
    chips: [
      { value: 1, x: 200, y: 190 },
      { value: 2, x: 270, y: 245 },
      { value: 3, x: 330, y: 160 },
      { value: 4, x: 400, y: 245 },
      { value: 5, x: 450, y: 180 },
    ],
    given: ['B=\\{1,2,3,4,5\\}', 'C=\\{5,4,3,2,1\\}'],
    results: [
      { key: 'forward', tex: 'B\\subseteq C' },
      { key: 'backward', tex: 'C\\subseteq B' },
      { key: 'equal', tex: 'B=C' },
    ],
    symbols: ['member', 'subset'],
    steps: [
      ...membersB.map((x) => checkStep(x, 'B', 'C')),
      { focus: [], reveal: 'forward', reasons: [{ key: 'allIn', a: 'B', b: 'C' }] },
      ...[...membersB].reverse().map((x) => checkStep(x, 'C', 'B', true)),
      { focus: [], reveal: 'backward', reasons: [{ key: 'allIn', a: 'C', b: 'B' }] },
      { focus: [], reveal: 'equal', reasons: [{ key: 'equal', a: 'B', b: 'C' }] },
    ],
    explain: (value) => [{ key: 'inBoth', x: `${value}`, a: 'B', b: 'C' }],
  },
  complement: {
    label: 'Aᶜ',
    shapes: [{ name: 'A', cx: 330, cy: 195, rx: 150, ry: 95, labelX: 455, labelY: 112 }],
    universe: true,
    chips: [
      { value: 0, x: 80, y: 90 },
      { value: 1, x: 250, y: 170 },
      { value: 2, x: 95, y: 285 },
      { value: 3, x: 320, y: 140 },
      { value: 4, x: 545, y: 85 },
      { value: 5, x: 400, y: 180 },
      { value: 6, x: 560, y: 290 },
      { value: 7, x: 290, y: 240 },
      { value: 8, x: 330, y: 326 },
      { value: 9, x: 390, y: 250 },
    ],
    given: ['S=\\{0,1,2,\\ldots,9\\}', 'A=\\{1,3,5,7,9\\}'],
    results: [],
    symbols: ['member', 'notMember', 'complement', 'suchThat'],
    steps: [
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
        (x): CheckStep =>
          x % 2 === 1
            ? { focus: [x], marks: [mark(x, '∈ A', 'muted')], reasons: [{ key: 'inSet', x: `${x}` }] }
            : { focus: [x], glow: [x], reasons: [{ key: 'inComplement', x: `${x}` }] },
      ),
      { focus: [], shade: true, reasons: [{ key: 'outside' }] },
    ],
    explain: (value) => [{ key: value % 2 === 1 ? 'inSet' : 'inComplement', x: `${value}` }],
  },
}

const exampleKeys: ExampleKey[] = ['subset', 'notSubset', 'equal', 'complement']
const delays = [0.5, 1, 1.5, 2, 3]

export function SubsetsAndComplementPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.subsetsAndComplement' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('subsetsAndComplement')
  const [exampleKey, setExampleKey] = useState<ExampleKey>('subset')
  const [selected, setSelected] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const example = examples[exampleKey]
  const player = useStepPlayer({ steps: example.steps.length, delayMs: delay * 1000, travelMs: 0 })

  const applied = player.target === null ? example.steps : example.steps.slice(0, player.target + 1)
  const current = player.target === null ? null : example.steps[player.target]
  const focus = current?.focus ?? []
  const marks = applied.flatMap((step) => step.marks ?? [])
  const glow = new Set(applied.flatMap((step) => step.glow ?? []))
  const revealed = new Set(applied.flatMap((step) => (step.reveal ? [step.reveal] : [])))
  const counter = applied.find((step) => step.counter !== undefined)?.counter ?? null
  const shaded = applied.some((step) => step.shade)

  const chips = example.chips.map((chip, index) => ({
    label: `${chip.value}`,
    x: chip.x,
    y: chip.y,
    glow: glow.has(chip.value) || focus.includes(chip.value),
    counter: counter === chip.value,
    selected: index === selected,
    marks: marks.filter((entry) => entry.value === chip.value),
  }))

  function reasonText(reasons: Reason[]) {
    return <MathText text={reasons.map(({ key, ...values }) => t(`reasons.${key}`, values)).join(' ')} />
  }

  function resultLines() {
    if (example.universe) {
      const members = [...glow].sort((a, b) => a - b)
      return [
        { key: 'rule', tex: t('complementRule'), shown: true },
        { key: 'list', tex: `A^C=\\{${members.join(',')}\\}`, shown: true },
      ]
    }
    return example.results.map((result) => ({ ...result, shown: revealed.has(result.key) }))
  }

  function chooseExample(key: ExampleKey) {
    player.stop()
    setSelected(null)
    setExampleKey(key)
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelected(null)
    player.start()
  }

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup
            options={exampleKeys.map((key) => ({ value: key, label: examples[key].label }))}
            value={exampleKey}
            onChange={chooseExample}
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
      stage={
        <div className="grid gap-5">
          <div className="pen-border relative bg-paper p-2">
            <VennCheckBoard
              shapes={example.shapes}
              chips={chips}
              universe={example.universe}
              outsideLabel={shaded ? 'A' : null}
              interactive={!player.playing}
              onSelect={(index) => setSelected((value) => (value === index ? null : index))}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="pen-border relative bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.given')}</h2>
              {example.given.map((tex) => (
                <MathTex key={tex} tex={tex} className="block overflow-x-auto py-1 text-[17px]" />
              ))}
            </div>
            <div className="pen-border relative bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.result')}</h2>
              {resultLines().map((line) => (
                <MathTex
                  key={line.key}
                  tex={line.tex}
                  className={`block overflow-x-auto py-1 text-[17px] transition-opacity duration-300 ${line.shown ? '' : 'opacity-15'}`}
                />
              ))}
            </div>
          </div>
        </div>
      }
      detail={
        <NoteCard>
          {selected === null ? (
            <p className="text-muted">{t('hint')}</p>
          ) : (
            <p>{reasonText(example.explain(example.chips[selected].value))}</p>
          )}
          <dl className="mt-4 grid grid-cols-[2.25rem_1fr] items-baseline gap-y-0.5 border-t border-dashed border-faint pt-3">
            {example.symbols.map((key) => (
              <div key={key} className="contents">
                <dt>
                  <MathTex tex={symbolTex[key]} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">{t(`symbols.${key}`)}</dd>
              </div>
            ))}
          </dl>
        </NoteCard>
      }
      progress={
        current && (
          <StepProgress
            compact
            total={example.steps.length}
            current={player.target!}
            caption={reasonText(current.reasons)}
          />
        )
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
