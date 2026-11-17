import { Fragment, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { TabButton } from '../components/atoms/TabButton'
import { Title } from '../components/atoms/Title'
import { NoteCard } from '../components/molecules/NoteCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PlayButton } from '../components/molecules/PlayButton'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { TitledCard } from '../components/molecules/TitledCard'
import { AreaRowsBoard, type AreaShape, type AreaSide } from '../components/organisms/AreaRowsBoard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { CuboidSlicesBoard, type CuboidSide } from '../components/organisms/CuboidSlicesBoard'
import { NumberLineArrowsBoard, type LineSide } from '../components/organisms/NumberLineArrowsBoard'
import { SignedAreaPlaneBoard, type PlaneSide } from '../components/organisms/SignedAreaPlaneBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import { numberLabel } from '../lib/numberLabel'

type LawKey = 'commutative' | 'associative' | 'distributive' | 'identity' | 'inverse' | 'derived'
type OperationKey = 'add' | 'mul'
type SampleKey =
  | 'commutativeAdd'
  | 'commutativeMul'
  | 'associativeAdd'
  | 'associativeMul'
  | 'distributive'
  | 'identityAdd'
  | 'identityMul'
  | 'inverseAdd'
  | 'inverseMul'
  | 'subtraction'
  | 'division'
type SideIndex = 0 | 1
type LegendKey = 'arrow' | 'now' | 'end' | 'cell' | 'cube' | 'halves' | 'negative' | 'mirror' | 'result'
type ChainReason =
  | 'subtractionDefinition'
  | 'divisionDefinition'
  | 'fourAsSum'
  | 'fourAsProduct'
  | 'associative'
  | 'inverse'
  | 'identity'

type ArrowData = { from: number; to: number; step: number; lane: number }
type BraceData = { from: number; to: number; label: string; step: number }
type MarkData = { at: number; label: string; step: number }
type LineSideData = { expression: string; end: number; arrows: ArrowData[]; braces: BraceData[]; marks: MarkData[] }
type PlaneSideData = { expression: string; width: number; height: number; step: number }
type CuboidSideData = { expression: string; split: 'layers' | 'slices'; steps: [number, number] }
type AreaShapeData =
  | { kind: 'rect'; x: number; width: number; height: number; label: string; stackedHalves: boolean; step: number }
  | { kind: 'brace'; x: number; width: number; lift: number; label: string; step: number }
  | { kind: 'segment'; from: number; to: number; step: number }
type AreaSideData = { expression: string; value: number; shapes: AreaShapeData[] }
type CuboidSize = { width: number; depth: number; height: number }

type SampleCommon = { tex: string; values: string; stepSides: (SideIndex | null)[] }
type OtherExampleKey = Exclude<SampleKey, 'inverseMul' | 'subtraction' | 'division'>
type Sample =
  | (SampleCommon & { kind: 'line'; sides: LineSideData[] })
  | (SampleCommon & { kind: 'plane'; sides: PlaneSideData[] })
  | (SampleCommon & { kind: 'cuboid'; size: CuboidSize; sides: CuboidSideData[] })
  | (SampleCommon & { kind: 'area'; sides: AreaSideData[] })

const lawKeys: LawKey[] = ['commutative', 'associative', 'distributive', 'identity', 'inverse', 'derived']
const operationKeys: OperationKey[] = ['add', 'mul']
const delays = [0.5, 1, 1.5, 2, 3]

const arrow = (from: number, to: number, step: number, lane = 0): ArrowData => ({ from, to, step, lane })
const rect = (x: number, width: number, height: number, step: number, label = '', stackedHalves = false): AreaShapeData => ({
  kind: 'rect',
  x,
  width,
  height,
  label,
  stackedHalves,
  step,
})

const sampleKeys: Record<LawKey, Record<OperationKey, SampleKey>> = {
  commutative: { add: 'commutativeAdd', mul: 'commutativeMul' },
  associative: { add: 'associativeAdd', mul: 'associativeMul' },
  distributive: { add: 'distributive', mul: 'distributive' },
  identity: { add: 'identityAdd', mul: 'identityMul' },
  inverse: { add: 'inverseAdd', mul: 'inverseMul' },
  derived: { add: 'subtraction', mul: 'division' },
}

const lawFormulas: Record<LawKey, { add: string; mul: string; shared: boolean }> = {
  commutative: { add: 'x + y = y + x', mul: 'x \\cdot y = y \\cdot x', shared: false },
  associative: { add: 'x + (y + z) = (x + y) + z', mul: 'x(yz) = (xy)z', shared: false },
  distributive: { add: 'x(y + z) = xy + xz', mul: 'x(y + z) = xy + xz', shared: true },
  identity: { add: 'x + 0 = x', mul: 'x \\cdot 1 = x', shared: false },
  inverse: { add: 'x + (-x) = 0', mul: 'x \\cdot x^{-1} = 1,\\ x \\neq 0', shared: false },
  derived: { add: 'x - y = x + (-y)', mul: '\\dfrac{x}{y} = x \\cdot y^{-1},\\ y \\neq 0', shared: false },
}

const samples: Record<SampleKey, Sample> = {
  commutativeAdd: {
    kind: 'line',
    tex: '2 + 3 = 3 + 2',
    values: 'x = 2,\\ y = 3',
    stepSides: [0, 0, 1, 1, null],
    sides: [
      { expression: '2 + 3', end: 5, arrows: [arrow(0, 2, 0), arrow(2, 5, 1)], braces: [], marks: [] },
      { expression: '3 + 2', end: 5, arrows: [arrow(0, 3, 2), arrow(3, 5, 3)], braces: [], marks: [] },
    ],
  },
  commutativeMul: {
    kind: 'plane',
    tex: '2 \\cdot (-4) = (-4) \\cdot 2',
    values: 'x = 2,\\ y = -4',
    stepSides: [0, 1, null],
    sides: [
      { expression: '2 · (−4)', width: 2, height: -4, step: 0 },
      { expression: '(−4) · 2', width: -4, height: 2, step: 1 },
    ],
  },
  associativeAdd: {
    kind: 'line',
    tex: '2 + \\left(4 + \\tfrac{1}{2}\\right) = (2 + 4) + \\tfrac{1}{2}',
    values: 'x = 2,\\ y = 4,\\ z = \\tfrac{1}{2}',
    stepSides: [0, 0, 1, 1, null],
    sides: [
      {
        expression: '2 + (4 + ½)',
        end: 6.5,
        arrows: [arrow(0, 2, 0), arrow(2, 6, 1), arrow(6, 6.5, 1)],
        braces: [{ from: 2, to: 6.5, label: '4 + ½ = 4½', step: 1 }],
        marks: [],
      },
      {
        expression: '(2 + 4) + ½',
        end: 6.5,
        arrows: [arrow(0, 2, 2), arrow(2, 6, 2), arrow(6, 6.5, 3)],
        braces: [{ from: 0, to: 6, label: '2 + 4 = 6', step: 2 }],
        marks: [],
      },
    ],
  },
  associativeMul: {
    kind: 'cuboid',
    tex: '2\\big((3)(4)\\big) = \\big((2)(3)\\big)4',
    values: 'x = 2,\\ y = 3,\\ z = 4',
    stepSides: [0, 0, 1, 1, null],
    size: { width: 3, depth: 4, height: 2 },
    sides: [
      { expression: '2 · (3 · 4)', split: 'layers', steps: [0, 1] },
      { expression: '(2 · 3) · 4', split: 'slices', steps: [2, 3] },
    ],
  },
  distributive: {
    kind: 'area',
    tex: '\\tfrac{1}{2}(2 + 4) = \\tfrac{1}{2}(2) + \\tfrac{1}{2}(4)',
    values: 'x = \\tfrac{1}{2},\\ y = 2,\\ z = 4',
    stepSides: [0, 0, 1, 1, null],
    sides: [
      {
        expression: '½(2 + 4)',
        value: 3,
        shapes: [{ kind: 'brace', x: 0, width: 6, lift: 0.5, label: '2 + 4 = 6', step: 0 }, rect(0, 6, 0.5, 1)],
      },
      { expression: '½(2) + ½(4)', value: 3, shapes: [rect(0, 2, 0.5, 2, '½ · 2 = 1'), rect(2.5, 4, 0.5, 3, '½ · 4 = 2')] },
    ],
  },
  identityAdd: {
    kind: 'line',
    tex: '-4 + 0 = -4',
    values: 'x = -4',
    stepSides: [0, 0, 1, null],
    sides: [
      { expression: '−4 + 0', end: -4, arrows: [arrow(0, -4, 0)], braces: [], marks: [{ at: -4, label: '+0', step: 1 }] },
      { expression: '−4', end: -4, arrows: [arrow(0, -4, 2)], braces: [], marks: [] },
    ],
  },
  identityMul: {
    kind: 'area',
    tex: '(4)(1) = 4',
    values: 'x = 4',
    stepSides: [0, 1, null],
    sides: [
      { expression: '(4)(1)', value: 4, shapes: [rect(0, 4, 1, 0, '4 · 1')] },
      { expression: '4', value: 4, shapes: [{ kind: 'segment', from: 0, to: 4, step: 1 }] },
    ],
  },
  inverseAdd: {
    kind: 'line',
    tex: '6 + (-6) = 0',
    values: 'x = 6,\\ -x = -6',
    stepSides: [0, 0, 1, null],
    sides: [
      { expression: '6 + (−6)', end: 0, arrows: [arrow(0, 6, 0), arrow(6, 0, 1, 1)], braces: [], marks: [] },
      { expression: '0', end: 0, arrows: [], braces: [], marks: [{ at: 0, label: '', step: 2 }] },
    ],
  },
  inverseMul: {
    kind: 'area',
    tex: '2 \\cdot 2^{-1} = 1',
    values: 'x = 2,\\ x^{-1} = \\tfrac{1}{2}',
    stepSides: [0, 1, null],
    sides: [
      { expression: '2 · 2⁻¹', value: 1, shapes: [rect(0, 2, 0.5, 0, '2 · ½')] },
      { expression: '1', value: 1, shapes: [rect(0, 1, 1, 1, '', true)] },
    ],
  },
  subtraction: {
    kind: 'line',
    tex: '4 - 3 = 4 + (-3) = 1',
    values: 'x = 4,\\ y = 3',
    stepSides: [0, 0, 1, null],
    sides: [
      { expression: '4 − 3', end: 1, arrows: [arrow(0, 4, 0), arrow(4, 1, 1, 1)], braces: [], marks: [] },
      { expression: '1', end: 1, arrows: [arrow(0, 1, 2)], braces: [], marks: [] },
    ],
  },
  division: {
    kind: 'area',
    tex: '\\dfrac{4}{2} = 4 \\cdot 2^{-1} = 2',
    values: 'x = 4,\\ y = 2',
    stepSides: [0, 1, null],
    sides: [
      { expression: '4/2', value: 2, shapes: [rect(0, 4, 0.5, 0, '4 · ½')] },
      { expression: '2', value: 2, shapes: [rect(0, 2, 1, 1, '', true)] },
    ],
  },
}

const otherExamples: Record<OtherExampleKey, string> = {
  commutativeAdd: '3 + 8 = 8 + 3',
  commutativeMul: '(-2) \\cdot 6 = 6 \\cdot (-2)',
  associativeAdd: '4 + (6 + 8) = (4 + 6) + 8',
  associativeMul: '(8)\\{(4)(-2)\\} = \\{(8)(4)\\}(-2)',
  distributive: '4(6 - 2) = (4)(6) + (4)(-2)',
  identityAdd: '4 + 0 = 4',
  identityMul: '(-2)(1) = -2',
  inverseAdd: '3 + (-3) = 0',
}

function hasOtherExample(key: SampleKey): key is OtherExampleKey {
  return key in otherExamples
}

const chains: Record<OperationKey, { tex: string; reason: ChainReason | null }[]> = {
  add: [
    { tex: '4 - 3', reason: null },
    { tex: '= 4 + (-3)', reason: 'subtractionDefinition' },
    { tex: '= (1 + 3) + (-3)', reason: 'fourAsSum' },
    { tex: '= 1 + \\big(3 + (-3)\\big)', reason: 'associative' },
    { tex: '= 1 + 0', reason: 'inverse' },
    { tex: '= 1', reason: 'identity' },
  ],
  mul: [
    { tex: '\\tfrac{4}{2}', reason: null },
    { tex: '= 4 \\cdot 2^{-1}', reason: 'divisionDefinition' },
    { tex: '= (2 \\cdot 2) \\cdot 2^{-1}', reason: 'fourAsProduct' },
    { tex: '= 2 \\cdot (2 \\cdot 2^{-1})', reason: 'associative' },
    { tex: '= 2 \\cdot 1', reason: 'inverse' },
    { tex: '= 2', reason: 'identity' },
  ],
}

function sideSteps(sample: Sample, index: number) {
  if (sample.kind === 'line') {
    const side = sample.sides[index]
    return [...side.arrows, ...side.braces, ...side.marks].map((piece) => piece.step)
  }
  if (sample.kind === 'plane') return [sample.sides[index].step]
  if (sample.kind === 'cuboid') return sample.sides[index].steps
  return sample.sides[index].shapes.map((shape) => shape.step)
}

function sideValue(sample: Sample, index: number) {
  if (sample.kind === 'line') return sample.sides[index].end
  if (sample.kind === 'plane') return sample.sides[index].width * sample.sides[index].height
  if (sample.kind === 'cuboid') return sample.size.width * sample.size.depth * sample.size.height
  return sample.sides[index].value
}

const stampClass =
  'inline-block rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 px-3 pt-1 pb-1.5 font-hand text-2xl leading-none font-bold whitespace-nowrap'
const footnoteClass = 'mt-4.5 text-[15px] text-muted'

export function FieldAxiomsPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.fieldAxioms' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('fieldAxioms')
  const [law, setLaw] = useState<LawKey>('commutative')
  const [operation, setOperation] = useState<OperationKey>('add')
  const [selection, setSelection] = useState<SideIndex | null>(null)
  const [delay, setDelay] = useState(1)

  const sampleKey = sampleKeys[law][operation]
  const sample = samples[sampleKey]
  const total = sample.stepSides.length
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const picked = current === null ? selection : null
  const comparing = current === total - 1
  const verdictShown = current === null || comparing
  const shared = lawFormulas[law].shared
  const captions = t(`samples.${sampleKey}.steps`, { returnObjects: true })
  const sideTitles = [t('sides.left'), t('sides.right')]

  const shown = (step: number) => current === null || step <= current
  const isNow = (step: number) => current === step
  const complete = (index: number) => shown(Math.max(...sideSteps(sample, index)))
  const started = (index: number) => shown(Math.min(...sideSteps(sample, index)))
  const result = (index: number) => (complete(index) ? numberLabel(sideValue(sample, index)) : null)
  const sideView = (index: number, expression: string) => ({
    title: sideTitles[index],
    expression,
    label: t('aria.side', { side: sideTitles[index], expression }),
    selected: picked === index,
    faded: picked !== null && picked !== index,
  })

  function chooseLaw(next: LawKey) {
    player.stop()
    setSelection(null)
    setLaw(next)
  }

  function chooseOperation(next: OperationKey) {
    player.stop()
    setSelection(null)
    setOperation(next)
  }

  function select(index: number) {
    const side: SideIndex = index === 0 ? 0 : 1
    setSelection((value) => (value === side ? null : side))
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelection(null)
    player.start()
  }

  function operationLabel(key: OperationKey) {
    if (law === 'derived') return t(key === 'add' ? 'operations.subtract' : 'operations.divide')
    return t(`operations.${key}`)
  }

  function figure() {
    const common = { interactive: !player.playing, onPick: select }
    if (sample.kind === 'line') {
      const values = [0, ...sample.sides.flatMap((side) => [side.end, ...side.arrows.flatMap((item) => [item.from, item.to])])]
      const sides: LineSide[] = sample.sides.map((side, index) => ({
        ...sideView(index, side.expression),
        started: started(index),
        arrows: side.arrows
          .filter((item) => shown(item.step))
          .map((item) => ({ from: item.from, to: item.to, lane: item.lane, label: numberLabel(item.to - item.from), now: isNow(item.step) })),
        braces: side.braces.filter((item) => shown(item.step)).map((item) => ({ ...item, now: isNow(item.step) })),
        marks: side.marks.filter((item) => shown(item.step)).map((item) => ({ ...item, now: isNow(item.step) })),
        end: complete(index) ? side.end : null,
      }))
      return (
        <NumberLineArrowsBoard
          lo={Math.floor(Math.min(...values)) - 1}
          hi={Math.ceil(Math.max(...values)) + 1}
          ends={[...new Set(sample.sides.map((side) => side.end))]}
          sides={sides}
          litEnd={verdictShown ? sample.sides[0].end : null}
          ariaLabel={t('aria.line')}
          {...common}
        />
      )
    }
    if (sample.kind === 'plane') {
      const sides: PlaneSide[] = sample.sides.map((side, index) => ({
        ...sideView(index, side.expression),
        width: side.width,
        height: side.height,
        shown: shown(side.step),
        now: isNow(side.step),
        result: result(index),
      }))
      return (
        <SignedAreaPlaneBoard
          sides={sides}
          mirrorOn={comparing}
          mirrorLabel={t('mirror')}
          resultLit={verdictShown}
          ariaLabel={t('aria.plane')}
          {...common}
        />
      )
    }
    if (sample.kind === 'cuboid') {
      const { size } = sample
      const sides: CuboidSide[] = sample.sides.map((side, index) => {
        const parts = side.split === 'layers' ? size.height : size.depth
        const each = (size.width * size.depth * size.height) / parts
        return {
          ...sideView(index, side.expression),
          split: side.split,
          parts: Array.from({ length: parts }, (_, part) => {
            const step = part === 0 ? side.steps[0] : side.steps[1]
            return { shown: shown(step), now: isNow(step) }
          }),
          note: complete(index) ? t(`cuboidNotes.${side.split}`, { parts, each }) : null,
          result: result(index),
        }
      })
      return <CuboidSlicesBoard size={size} sides={sides} resultLit={verdictShown} ariaLabel={t('aria.cuboid')} {...common} />
    }
    const sides: AreaSide[] = sample.sides.map((side, index) => ({
      ...sideView(index, side.expression),
      shapes: side.shapes.filter((shape) => shown(shape.step)).map((shape): AreaShape => ({ ...shape, now: isNow(shape.step) })),
      extent: {
        width: Math.max(...side.shapes.map((shape) => (shape.kind === 'segment' ? shape.to : shape.x + shape.width))),
        height: Math.max(0, ...side.shapes.map((shape) => (shape.kind === 'rect' ? shape.height : 0))),
      },
      result: result(index),
    }))
    return <AreaRowsBoard sides={sides} resultLit={verdictShown} ariaLabel={t('aria.area')} {...common} />
  }

  function stamp() {
    if (!verdictShown) {
      return (
        <span data-verdict="pending" className={`${stampClass} border-dashed border-faint text-faint`}>
          ?
        </span>
      )
    }
    return (
      <span data-verdict="same" className={`${stampClass} border-ink bg-highlight dark:text-paper`}>
        {t('same')}
      </span>
    )
  }

  function substitutionCard() {
    const lines = [
      { key: 'formula', tex: lawFormulas[law][operation] },
      { key: 'values', tex: sample.values },
      { key: 'example', tex: sample.tex },
    ] as const
    return (
      <TitledCard title={t('cards.substitution')}>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-3">
          {lines.map((line) => (
            <Fragment key={line.key}>
              <span className="font-hand text-[21px] leading-none text-muted">{t(`substitution.${line.key}`)}</span>
              <MathTex tex={line.tex} />
            </Fragment>
          ))}
        </div>
        <p className={footnoteClass}>
          <MathText text={t('substitution.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function sideCard() {
    if (law === 'derived') {
      return (
        <TitledCard title={t('cards.chain')}>
          <table className="w-full border-collapse">
            <tbody>
              {chains[operation].map((line, index) => (
                <tr key={line.tex} className={index > 0 ? 'border-t border-dashed border-faint' : ''}>
                  <td className="py-1.75 pr-3 whitespace-nowrap">
                    <MathTex tex={line.tex} />
                  </td>
                  <td className="py-1.75 text-[15px] text-muted">
                    {line.reason && <MathText text={t(`chain.reasons.${line.reason}`)} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={footnoteClass}>
            <MathText text={t(operation === 'add' ? 'chain.footnoteSubtraction' : 'chain.footnoteDivision')} />
          </p>
        </TitledCard>
      )
    }
    if (!hasOtherExample(sampleKey)) {
      return (
        <TitledCard title={<MathText text={t('cards.nonzero')} />}>
          <p>
            <MathText text={t('nonzero.body')} />
          </p>
          <p className={footnoteClass}>{t('nonzero.footnote')}</p>
        </TitledCard>
      )
    }
    return (
      <TitledCard title={t('cards.others')}>
        <p data-other-example>
          <MathTex tex={otherExamples[sampleKey]} />
          <span className="mt-1.5 block text-[15px] text-muted">{t(`otherRemarks.${sampleKey}`)}</span>
        </p>
      </TitledCard>
    )
  }

  function lawTableCard() {
    const cellClass = 'border-t border-dashed border-faint py-3.5 pr-4 align-top text-[15px] transition-opacity duration-300'
    return (
      <TitledCard title={t('cards.laws')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-hand text-[21px] leading-tight font-bold">
                <th className="pr-4 pb-3 pl-2">{t('lawTable.property')}</th>
                <th className="pr-4 pb-3">{t('lawTable.addition')}</th>
                <th className="pr-4 pb-3">{t('lawTable.multiplication')}</th>
              </tr>
            </thead>
            <tbody>
              {lawKeys.map((key) => {
                const formulas = lawFormulas[key]
                const active = key === law
                const derivedRule = key === 'derived' ? 'border-t-[1.5px] border-solid border-ink' : ''
                const dim = (side: OperationKey) => (active && !formulas.shared && side !== operation ? 'opacity-45' : '')
                return (
                  <tr key={key} data-law={key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                    <th className={`${cellClass} ${derivedRule} pl-2 font-normal whitespace-nowrap`}>
                      {t(`laws.${key}`)}
                      {key === 'derived' && <span className="mt-1 block text-sm whitespace-normal text-muted">{t('lawTable.derived')}</span>}
                    </th>
                    {formulas.shared ? (
                      <td colSpan={2} className={`${cellClass} ${derivedRule}`}>
                        <MathTex tex={formulas.add} />
                      </td>
                    ) : (
                      operationKeys.map((side) => (
                        <td key={side} className={`${cellClass} ${derivedRule} ${dim(side)}`}>
                          <MathTex tex={formulas[side]} />
                        </td>
                      ))
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className={footnoteClass}>
          <MathText text={t('lawTable.footnote')} />
        </p>
      </TitledCard>
    )
  }

  const legendIconClass = 'block h-5.5 w-11'
  const cellIcon = (
    <svg viewBox="0 0 44 22" className={legendIconClass}>
      <rect x={13} y={2} width={18} height={18} className="fill-highlight-soft" />
      <rect x={13} y={2} width={18} height={18} strokeWidth={2} className="fill-none stroke-ink" />
    </svg>
  )

  function legendItems(): { key: LegendKey; icon: ReactNode }[] {
    if (sample.kind === 'line') {
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
        {
          key: 'end',
          icon: (
            <span className="flex h-5.5 w-11 items-center justify-center">
              <span className="bg-highlight px-2 font-math text-[15px] font-bold dark:text-paper">5</span>
            </span>
          ),
        },
      ]
    }
    const items: { key: LegendKey; icon: ReactNode }[] = [{ key: sample.kind === 'cuboid' ? 'cube' : 'cell', icon: cellIcon }]
    if (sample.kind === 'area') {
      items.push({
        key: 'halves',
        icon: (
          <svg viewBox="0 0 44 22" className={legendIconClass}>
            <rect x={13} y={2} width={18} height={18} className="fill-highlight-soft" />
            <line x1={13} x2={31} y1={11} y2={11} strokeWidth={1.3} strokeDasharray="4 3" className="stroke-ink" />
            <rect x={13} y={2} width={18} height={18} strokeWidth={2} className="fill-none stroke-ink" />
          </svg>
        ),
      })
    }
    if (sample.kind === 'plane') {
      items.push(
        {
          key: 'negative',
          icon: (
            <svg viewBox="0 0 44 22" className={legendIconClass}>
              {[0, 1, 2, 3].map((index) => (
                <line key={index} x1={13 + index * 6} y1={20} x2={13 + index * 6 + 6} y2={2} strokeWidth={2} className="stroke-marker opacity-55" />
              ))}
              <rect x={13} y={2} width={18} height={18} strokeWidth={2} className="fill-none stroke-marker" />
            </svg>
          ),
        },
        {
          key: 'mirror',
          icon: (
            <svg viewBox="0 0 44 22" className={legendIconClass}>
              <line x1={6} y1={20} x2={38} y2={2} strokeWidth={1.6} strokeDasharray="6 5" className="stroke-muted" />
            </svg>
          ),
        },
      )
    }
    items.push(
      {
        key: 'now',
        icon: (
          <svg viewBox="0 0 44 22" className={legendIconClass}>
            <rect x={13} y={2} width={18} height={18} strokeWidth={3} className="fill-none stroke-marker" />
          </svg>
        ),
      },
      {
        key: 'result',
        icon: (
          <span className="flex h-5.5 w-11 items-center justify-center">
            <span className="bg-highlight px-1.5 font-hand text-xl leading-tight font-bold dark:text-paper">= 3</span>
          </span>
        ),
      },
    )
    return items
  }

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
          <div
            inert={shared}
            data-operations={shared ? 'off' : 'on'}
            className={`flex basis-full flex-wrap items-baseline gap-x-5 gap-y-3 transition-opacity duration-300 ${shared ? 'opacity-35' : ''}`}
          >
            {operationKeys.map((key) => (
              <TabButton key={key} active={!shared && key === operation} onClick={() => chooseOperation(key)}>
                {operationLabel(key)}
              </TabButton>
            ))}
            {shared && <span className="text-[15px] text-muted">{t('operations.both')}</span>}
          </div>
        </>
      }
      board={
        <TitledCard title={t(`samples.${sampleKey}.title`)}>
          <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-2">
            <MathTex tex={sample.tex} className="[&_.katex]:text-[1.35em]!" />
            {stamp()}
          </div>
          {figure()}
        </TitledCard>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={current !== null && <MathText text={captions[current]} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-6 sm:grid-cols-2">
          {substitutionCard()}
          {sideCard()}
          {lawTableCard()}
        </div>
      }
      detail={
        <NoteCard>
          {picked !== null ? (
            <>
              <p className="mb-3.5">
                {sideTitles[picked]} <span className="font-math text-[19px]">{sample.sides[picked].expression}</span>
              </p>
              <ol className="mb-3.5 grid gap-2">
                {sample.stepSides.flatMap((side, step) => (side === picked ? [captions[step]] : [])).map((line, index) => (
                  <li key={line} className="flex items-baseline gap-2.5">
                    <span className="min-w-4.5 font-bold text-muted">{index + 1}</span>
                    <span>
                      <MathText text={line} />
                    </span>
                  </li>
                ))}
              </ol>
              <p className="text-muted">
                {t('reading.result', { value: numberLabel(sideValue(sample, picked)), other: sideTitles[1 - picked] })}
              </p>
            </>
          ) : (
            <>
              <p className="mb-3.5">
                <MathText text={t(`samples.${sampleKey}.intro`)} />
              </p>
              <p className="text-muted">{t('hint')}</p>
            </>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-t border-dashed border-faint pt-3">
            {legendItems().map((item) => (
              <div key={item.key} className="contents">
                <dt>{item.icon}</dt>
                <dd className="text-muted">{t(`legend.${item.key}`)}</dd>
              </div>
            ))}
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
