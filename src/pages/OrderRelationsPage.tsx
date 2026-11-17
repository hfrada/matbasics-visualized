import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { Stamp } from '../components/atoms/Stamp'
import { TabButton } from '../components/atoms/TabButton'
import { Title } from '../components/atoms/Title'
import { NoteCard } from '../components/molecules/NoteCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PlayButton } from '../components/molecules/PlayButton'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { TitledCard } from '../components/molecules/TitledCard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { HasseDiagramBoard, type HasseEdge, type HasseNodeTone } from '../components/organisms/HasseDiagramBoard'
import { InequalityStepsTable, type StepTableRow } from '../components/organisms/InequalityStepsTable'
import { RelationDigraphBoard, type DigraphMark } from '../components/organisms/RelationDigraphBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  coverPath,
  downSet,
  greatestMember,
  hasseLevels,
  incomparablePair,
  isCover,
  leastMember,
  maximalMembers,
  minimalMembers,
  strictPairs,
  upSet,
} from '../lib/order'
import { checkProperty, relationMatrix, type IndexPair, type PropertyCase, type PropertyKey, type RelationMatrix } from '../lib/relationProperties'

type GroupKey = 'partial' | 'hasse' | 'extremes'
type SampleKey = 'lessEq' | 'divides' | 'less' | 'sameParity' | 'listed' | 'subsets' | 'divides30' | 'dividesMiddle' | 'properSubsets'
type Member = { label: string; tex: string }
type Sample = { members: Member[]; holds: (i: number, j: number) => boolean; test: 'truth' | 'parity' | 'list' | 'subset'; expression: (i: number, j: number) => string }
type OrderKind = 'total' | 'partial' | 'none'
type FormulaKey = 'partial' | 'total' | 'cover' | 'minimal' | 'maximal' | 'least' | 'greatest'
type LegendKey = 'arrow' | 'loop' | 'now' | 'missing' | 'path' | 'line' | 'lit' | 'focus' | 'ring'

type PartialStep = { row: StepTableRow; caption: string; marks: DigraphMark[] }
type HasseStep = { row: StepTableRow; caption: string; loops: boolean; removed: number; now: IndexPair | null; arrows: boolean }
type ExtremeStep = { row: StepTableRow; caption: string; tones: Partial<Record<number, HasseNodeTone>> }

const delays = [0.5, 1, 1.5, 2, 3]
const groupKeys: GroupKey[] = ['partial', 'hasse', 'extremes']
const groupSamples: Record<GroupKey, SampleKey[]> = {
  partial: ['lessEq', 'divides', 'less', 'sameParity', 'listed'],
  hasse: ['divides', 'subsets', 'divides30', 'lessEq'],
  extremes: ['divides', 'dividesMiddle', 'subsets', 'properSubsets', 'lessEq'],
}
const orderParts = ['reflexive', 'antisymmetric', 'transitive'] as const satisfies PropertyKey[]
type OrderPart = (typeof orderParts)[number]
const formulaKeys: FormulaKey[] = ['partial', 'total', 'cover', 'minimal', 'maximal', 'least', 'greatest']
const activeFormulas: Record<GroupKey, FormulaKey[]> = { partial: ['partial', 'total'], hasse: ['cover'], extremes: ['minimal', 'maximal', 'least', 'greatest'] }
const legendKeys: Record<GroupKey, LegendKey[]> = {
  partial: ['arrow', 'loop', 'now', 'missing'],
  hasse: ['arrow', 'loop', 'now', 'path', 'line'],
  extremes: ['line', 'lit', 'focus', 'ring'],
}
const footnoteClass = 'mt-3 text-sm text-muted'
const cellClass = 'border-t border-dashed border-faint py-2 pr-3 pl-1.5 align-middle'
const letters = ['a', 'b', 'c']

const numbers = (values: number[]): Member[] => values.map((value) => ({ label: String(value), tex: String(value) }))
const maskLetters = (mask: number) => letters.filter((_, bit) => mask & (1 << bit))
const subsetMembers = (masks: number[]): Member[] =>
  masks.map((mask) => (mask === 0 ? { label: '∅', tex: '\\varnothing' } : { label: `{${maskLetters(mask).join(',')}}`, tex: `\\{${maskLetters(mask).join(', ')}\\}` }))
const allMasks = [0, 1, 2, 4, 3, 5, 6, 7]
const properMasks = [1, 2, 4, 3, 5, 6]

function numberSample(values: number[], test: 'truth' | 'parity', holds: (a: number, b: number) => boolean, expression: (a: number, b: number) => string): Sample {
  return { members: numbers(values), test, holds: (i, j) => holds(values[i], values[j]), expression: (i, j) => expression(values[i], values[j]) }
}

function subsetSample(masks: number[]): Sample {
  const members = subsetMembers(masks)
  return { members, test: 'subset', holds: (i, j) => (masks[i] & masks[j]) === masks[i], expression: (i, j) => `${members[i].tex} \\subseteq ${members[j].tex}` }
}

const listedPairs = ['1-1', '2-2', '3-3', '1-2', '2-3']
const divides = (a: number, b: number) => b % a === 0
const dividesTex = (a: number, b: number) => `${a} \\mid ${b}`

const samples: Record<SampleKey, Sample> = {
  lessEq: numberSample([1, 2, 3, 4], 'truth', (a, b) => a <= b, (a, b) => `${a} \\le ${b}`),
  divides: numberSample([1, 2, 3, 4, 6, 12], 'truth', divides, dividesTex),
  less: numberSample([1, 2, 3, 4], 'truth', (a, b) => a < b, (a, b) => `${a} < ${b}`),
  sameParity: numberSample([1, 2, 3, 4], 'parity', (a, b) => (a + b) % 2 === 0, (a, b) => `${a} + ${b} = ${a + b}`),
  listed: { members: numbers([1, 2, 3]), test: 'list', holds: (i, j) => listedPairs.includes(`${i + 1}-${j + 1}`), expression: (i, j) => `(${i + 1}, ${j + 1})` },
  subsets: subsetSample(allMasks),
  divides30: numberSample([1, 2, 3, 5, 6, 10, 15, 30], 'truth', divides, dividesTex),
  dividesMiddle: numberSample([2, 3, 4, 6], 'truth', divides, dividesTex),
  properSubsets: subsetSample(properMasks),
}

export function OrderRelationsPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.orderRelations' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('orderRelations')
  const [group, setGroup] = useState<GroupKey>('partial')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [pick, setPick] = useState<number | null>(null)
  const [delay, setDelay] = useState(1.5)

  const sampleKey = groupSamples[group][exampleIndex]
  const sample = samples[sampleKey]
  const { members } = sample
  const texOf = (index: number) => members[index].tex
  const matrix: RelationMatrix = relationMatrix(members.length, sample.holds)
  const checks = Object.fromEntries(orderParts.map((key) => [key, checkProperty(matrix, key)])) as Record<OrderPart, ReturnType<typeof checkProperty>>
  const failedPart: OrderPart | null = orderParts.find((key) => !checks[key].holds) ?? null
  const incomparable = failedPart ? null : incomparablePair(matrix)
  const kind: OrderKind = failedPart ? 'none' : incomparable ? 'partial' : 'total'
  const pairOf = ([i, j]: IndexPair) => `(${texOf(i)}, ${texOf(j)})`
  const setOf = (indices: number[]) => (indices.length === 0 ? '\\varnothing' : `\\{${indices.map(texOf).join(', ')}\\}`)

  function why([i, j]: IndexPair) {
    const holds = sample.holds(i, j)
    const expression = sample.expression(i, j)
    if (sample.test === 'list') return t(holds ? 'why.listed' : 'why.unlisted', { pair: expression })
    return t('why.rule', { expression, verdict: t(`words.${sample.test}.${holds}`) })
  }

  function counterTex(entry: PropertyCase) {
    const need = `${pairOf(entry.need)} ${entry.wantIn ? '\\notin' : '\\in'} \\mathrm R`
    return entry.premises.length === 0 ? need : `${entry.premises.map(pairOf).join(', ')} \\in \\mathrm R,\\ ${need}`
  }

  function caseMarks(entry: PropertyCase): DigraphMark[] {
    const inR = matrix[entry.need[0]][entry.need[1]]
    const premises = entry.premises.map((pair): DigraphMark => ({ pair, tone: 'now' }))
    if (entry.wantIn) return [...premises, { pair: entry.need, tone: inR ? 'need' : 'missing' }]
    return inR ? [...premises, { pair: entry.need, tone: 'now' }] : premises
  }

  function verdictText(key: OrderPart) {
    const check = checks[key]
    const name = t(`names.${key}`)
    if (check.failure) return t('verdict.no', { counter: counterTex(check.failure), why: why(check.failure.need), name })
    if (check.cases.length === 0) return t('verdict.empty', { name })
    return t('verdict.yes', { count: check.cases.length, name })
  }

  function partialSteps(): PartialStep[] {
    const failAt = failedPart ? orderParts.indexOf(failedPart) : orderParts.length - 1
    const steps = orderParts.slice(0, failAt + 1).map(
      (key): PartialStep => ({
        row: {
          key,
          tex: t(`formulas.${key}`),
          reason: verdictText(key),
          flip: !checks[key].holds,
          testTex: checks[key].holds ? '\\checkmark' : '\\times',
          holds: checks[key].holds,
          visible: true,
          now: false,
        },
        caption: verdictText(key),
        marks: checks[key].failure ? caseMarks(checks[key].failure) : [],
      }),
    )
    if (!failedPart) {
      const pair = incomparable
      const text = pair ? t('steps.incomparable', { a: texOf(pair[0]), b: texOf(pair[1]), forward: why(pair), backward: why([pair[1], pair[0]]) }) : t('steps.comparable')
      steps.push({
        row: { key: 'comparable', tex: t('formulas.total'), reason: text, flip: false, testTex: pair ? '\\times' : '\\checkmark', holds: pair === null, visible: true, now: false },
        caption: text,
        marks: pair
          ? [
              { pair, tone: 'missing' },
              { pair: [pair[1], pair[0]], tone: 'missing' },
            ]
          : [],
      })
    }
    const finalText = failedPart ? t('steps.notOrder', { name: t(`names.${failedPart}`) }) : t(`steps.${kind as 'total' | 'partial'}`)
    steps.push({
      row: { key: 'final', tex: t(`formulas.${kind === 'total' ? 'total' : 'partial'}`), reason: finalText, flip: kind === 'none', testTex: kind === 'none' ? '\\times' : '\\checkmark', holds: kind !== 'none', visible: true, now: false },
      caption: finalText,
      marks: failedPart && checks[failedPart].failure ? caseMarks(checks[failedPart].failure) : incomparable ? steps[steps.length - 1].marks : [],
    })
    return steps
  }

  const levels = kind === 'none' ? members.map(() => 0) : hasseLevels(matrix)
  const pairs = strictPairs(matrix)
  const covers = pairs.filter(([a, b]) => isCover(matrix, a, b))
  const shortcuts = pairs.filter(([a, b]) => !isCover(matrix, a, b))
  const pathTex = ([a, b]: IndexPair) => coverPath(matrix, a, b).map(texOf).join(' \\to ')

  function hasseSteps(): HasseStep[] {
    const base = { visible: true, now: false, flip: false, holds: false, testTex: '' }
    const steps: HasseStep[] = [
      {
        row: { ...base, key: 'full', tex: `|\\mathrm R| = ${pairs.length + members.length}`, reason: t('rows.full') },
        caption: t('steps.full', { count: pairs.length + members.length }),
        loops: true,
        removed: -1,
        now: null,
        arrows: true,
      },
      {
        row: { ...base, key: 'loops', tex: `(x, x) \\in \\mathrm R`, reason: t('rows.loops', { count: members.length }) },
        caption: t('steps.loops', { count: members.length }),
        loops: false,
        removed: -1,
        now: null,
        arrows: true,
      },
    ]
    shortcuts.forEach((pair, index) => {
      steps.push({
        row: { ...base, key: `shortcut${index}`, tex: `${texOf(pair[0])} \\to ${texOf(pair[1])}`, reason: t('rows.shortcut', { path: pathTex(pair) }) },
        caption: t('steps.shortcut', { a: texOf(pair[0]), b: texOf(pair[1]), path: pathTex(pair) }),
        loops: false,
        removed: index,
        now: pair,
        arrows: true,
      })
    })
    steps.push({
      row: { ...base, key: 'lines', tex: t('rows.linesTex', { count: covers.length }), reason: t('rows.lines', { total: pairs.length + members.length }) },
      caption: t('steps.arrows', { count: covers.length, total: pairs.length + members.length }),
      loops: false,
      removed: shortcuts.length,
      now: null,
      arrows: false,
    })
    return steps
  }

  const minimal = minimalMembers(matrix)
  const maximal = maximalMembers(matrix)
  const least = leastMember(matrix)
  const greatest = greatestMember(matrix)

  function extremeText(which: 'least' | 'greatest') {
    const found = which === 'least' ? least : greatest
    const rivals = which === 'least' ? minimal : maximal
    return found === null ? t(`steps.${which}.none`, { set: setOf(rivals) }) : t(`steps.${which}.found`, { x: texOf(found) })
  }

  function extremeSteps(): ExtremeStep[] {
    const base = { visible: true, now: false, flip: false, testTex: '' }
    const lit = (indices: number[], tone: HasseNodeTone) => Object.fromEntries(indices.map((index) => [index, tone]))
    const step = (which: 'least' | 'greatest'): ExtremeStep => {
      const found = which === 'least' ? least : greatest
      const rivals = which === 'least' ? minimal : maximal
      return {
        row: {
          ...base,
          key: which,
          tex: found === null ? t(`rows.${which}None`) : t(`rows.${which}Tex`, { x: texOf(found) }),
          reason: extremeText(which),
          flip: found === null,
          holds: found !== null,
          testTex: found === null ? '\\times' : '\\checkmark',
        },
        caption: extremeText(which),
        tones: found === null ? lit(rivals, 'focus') : { [found]: 'ring' },
      }
    }
    return [
      {
        row: { ...base, key: 'minimal', tex: t('rows.minimalTex', { set: setOf(minimal) }), reason: t('rows.minimal'), holds: false },
        caption: t('steps.minimal', { set: setOf(minimal) }),
        tones: lit(minimal, 'lit'),
      },
      {
        row: { ...base, key: 'maximal', tex: t('rows.maximalTex', { set: setOf(maximal) }), reason: t('rows.maximal'), holds: false },
        caption: t('steps.maximal', { set: setOf(maximal) }),
        tones: lit(maximal, 'lit'),
      },
      step('least'),
      step('greatest'),
    ]
  }

  const partial = group === 'partial' ? partialSteps() : []
  const hasse = group === 'hasse' ? hasseSteps() : []
  const extremes = group === 'extremes' ? extremeSteps() : []
  const steps: { row: StepTableRow; caption: string }[] = group === 'partial' ? partial : group === 'hasse' ? hasse : extremes
  const total = steps.length
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const reached = (index: number) => current === null || current >= index
  const rows = steps.map((step, index) => ({ ...step.row, visible: reached(index), now: current === index }))
  const last = steps.length - 1
  const shownIndex = current ?? last
  const picking = group !== 'partial' && current === null

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

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setPick(null)
    player.start()
  }

  function pickTones(): Partial<Record<number, HasseNodeTone>> {
    if (pick === null) return {}
    return Object.fromEntries([...downSet(matrix, pick).map((index) => [index, 'lit']), ...upSet(matrix, pick).map((index) => [index, 'lit']), [pick, 'focus']])
  }

  function pickReading(index: number) {
    const under = downSet(matrix, index)
    const over = upSet(matrix, index)
    const others = members.map((_, other) => other).filter((other) => other !== index && !under.includes(other) && !over.includes(other))
    const roles = [
      minimal.includes(index) && t('roles.minimal'),
      maximal.includes(index) && t('roles.maximal'),
      least === index && t('roles.least'),
      greatest === index && t('roles.greatest'),
    ].filter(Boolean)
    return t('reading.pick', {
      x: texOf(index),
      below: setOf(under),
      above: setOf(over),
      others: setOf(others),
      roles: roles.length > 0 ? roles.join(', ') : t('roles.none'),
    })
  }

  function figure() {
    if (group === 'partial') {
      return (
        <RelationDigraphBoard
          name="A"
          labels={members.map((member) => member.label)}
          matrix={matrix}
          marks={partial[shownIndex].marks}
          litNodes={[]}
          ariaLabel={t('aria.digraph')}
        />
      )
    }
    const hasseStep = group === 'hasse' ? hasse[shownIndex] : null
    const edges: HasseEdge[] = [
      ...covers.map(([from, to]): HasseEdge => ({ from, to, shortcut: false, tone: 'plain' })),
      ...shortcuts
        .filter((_, index) => hasseStep !== null && (index > hasseStep.removed || (index === hasseStep.removed && hasseStep.now !== null)))
        .map(([from, to]): HasseEdge => ({ from, to, shortcut: true, tone: 'plain' })),
    ]
    if (hasseStep?.now) {
      const [a, b] = hasseStep.now
      const path = coverPath(matrix, a, b)
      for (const edge of edges) {
        if (edge.from === a && edge.to === b) edge.tone = 'now'
        const at = path.indexOf(edge.from)
        if (!edge.shortcut && at !== -1 && path[at + 1] === edge.to) edge.tone = 'path'
      }
    }
    const tones = picking ? pickTones() : group === 'extremes' ? extremes[shownIndex].tones : {}
    return (
      <HasseDiagramBoard
        labels={members.map((member) => member.label)}
        levels={levels}
        edges={edges}
        loops={hasseStep?.loops ? members.map((_, index) => index) : []}
        arrows={hasseStep ? hasseStep.arrows : false}
        tones={tones}
        interactive={picking}
        onPick={(index) => setPick((previous) => (previous === index ? null : index))}
        ariaLabel={t('aria.hasse')}
      />
    )
  }

  function idleReading() {
    if (pick !== null && group !== 'partial') return pickReading(pick)
    if (group === 'extremes') {
      return t('reading.extremes', {
        minimal: setOf(minimal),
        maximal: setOf(maximal),
        least: least === null ? t('roles.missing') : `$${texOf(least)}$`,
        greatest: greatest === null ? t('roles.missing') : `$${texOf(greatest)}$`,
      })
    }
    if (group === 'hasse') return t('reading.hasse', { count: covers.length, total: pairs.length + members.length })
    return steps[last].caption
  }

  function stamps() {
    const done = reached(last)
    if (group === 'partial') {
      return <Stamp tone={!done ? 'pending' : kind === 'none' ? 'flip' : 'yes'}>{t(`stamps.${done ? kind : 'partial'}`)}</Stamp>
    }
    if (group === 'hasse') return <Stamp tone={done ? 'yes' : 'pending'}>{t('stamps.hasse')}</Stamp>
    return (['least', 'greatest'] as const).map((which, index) => {
      const found = which === 'least' ? least : greatest
      const shown = reached(index + 2)
      return (
        <Stamp key={which} tone={!shown ? 'pending' : found === null ? 'flip' : 'yes'}>
          {found === null ? t(`stamps.${which}None`) : <MathText text={t(`stamps.${which}`, { x: texOf(found) })} />}
        </Stamp>
      )
    })
  }

  function propertiesCard() {
    const rowsOf: { key: string; name: string; holds: boolean; note: string | null }[] = [
      ...orderParts.map((key) => ({ key, name: t(`names.${key}`), holds: checks[key].holds, note: checks[key].failure ? counterTex(checks[key].failure) : null })),
      { key: 'partial', name: t('names.partial'), holds: kind !== 'none', note: null },
      { key: 'total', name: t('names.total'), holds: kind === 'total', note: incomparable ? t('properties.incomparable', { a: texOf(incomparable[0]), b: texOf(incomparable[1]) }) : null },
    ]
    return (
      <TitledCard key="properties" title={t('cards.properties')} wide>
        <table className="w-full border-collapse text-left">
          <tbody>
            {rowsOf.map((row) => (
              <tr key={row.key} data-property={row.key} data-holds={row.holds}>
                <td className={`${cellClass} font-hand text-[21px] leading-tight font-bold`}>{row.name}</td>
                <td className={`${cellClass} text-right`}>
                  <span className={`inline-block px-1.5 font-hand text-[20px] leading-tight font-bold ${row.holds ? 'bg-highlight dark:text-paper' : 'text-marker'}`}>
                    {t(row.holds ? 'words.yes' : 'words.no')}
                  </span>
                  {row.note && (
                    <span className="mt-0.5 block text-sm text-muted">
                      <MathText text={row.key === 'total' ? row.note : t('properties.counter', { counter: row.note })} />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={footnoteClass}>
          <MathText text={t('properties.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function leftOutCard() {
    return (
      <TitledCard key="leftOut" title={t('cards.leftOut')}>
        <div className="grid gap-3.5">
          {(['loops', 'shortcuts', 'arrows'] as const).map((key) => (
            <p key={key} data-left-out={key}>
              <span className="block font-hand text-[21px] leading-tight font-bold">{t(`leftOut.${key}.name`)}</span>
              <span className="mt-1 block text-[15px] text-muted">
                <MathText text={t(`leftOut.${key}.why`)} />
              </span>
            </p>
          ))}
        </div>
      </TitledCard>
    )
  }

  function linesCard() {
    return (
      <TitledCard key="lines" title={t('cards.lines')}>
        <p data-lines={covers.length} className="flex flex-wrap gap-x-4 gap-y-1 leading-loose">
          {covers.map(([a, b]) => (
            <span key={`${a}-${b}`} data-line={`${a}-${b}`} className="whitespace-nowrap">
              <MathTex tex={`${texOf(a)} \\to ${texOf(b)}`} />
            </span>
          ))}
        </p>
        <p className={footnoteClass}>
          <MathText text={t('linesCard.count', { count: covers.length, shortcuts: shortcuts.length, loops: members.length })} />
        </p>
      </TitledCard>
    )
  }

  function membersCard() {
    const columns = ['minimal', 'maximal', 'least', 'greatest'] as const
    const has = (column: (typeof columns)[number], index: number) =>
      column === 'minimal' ? minimal.includes(index) : column === 'maximal' ? maximal.includes(index) : column === 'least' ? least === index : greatest === index
    return (
      <TitledCard key="members" title={t('cards.members')} wide>
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-hand text-[19px] leading-tight font-bold">
                <th className="pb-2 pl-1.5" />
                {columns.map((column) => (
                  <th key={column} className="px-1.5 pb-2 text-center">
                    {t(`roles.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr key={member.label} data-member={member.label} className={pick === index ? 'bg-highlight-soft' : ''}>
                  <td className={cellClass}>
                    <MathTex tex={member.tex} />
                  </td>
                  {columns.map((column) => (
                    <td key={column} data-role={column} data-has={has(column, index)} className={`${cellClass} text-center`}>
                      {has(column, index) ? <MathTex tex="\checkmark" /> : <span className="text-faint">·</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={footnoteClass}>
          <MathText text={t('membersCard.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function rulesCard() {
    return (
      <TitledCard key="rules" title={t('cards.rules')} wide>
        <table className="w-full border-collapse text-left">
          <tbody>
            {formulaKeys.map((key) => {
              const active = activeFormulas[group].includes(key)
              return (
                <tr key={key} data-rule={key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                  <td className={cellClass}>
                    <MathTex tex={t(`formulas.${key}`)} />
                    <span className="block text-sm text-muted">
                      <MathText text={t(`rules.${key}`)} />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className={footnoteClass}>
          <MathText text={t('rulesFootnote')} />
        </p>
      </TitledCard>
    )
  }

  const cards: ReactNode[] = group === 'partial' ? [propertiesCard()] : group === 'hasse' ? [leftOutCard(), linesCard()] : [membersCard()]
  cards.push(rulesCard())

  const arrowHead = (className: string) => <path d="M40 11 L30.7 7.3 L30.7 14.7 Z" className={className} />
  const legendIcons: Record<LegendKey, ReactNode> = {
    arrow: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={1.6} className="stroke-ink" />
        {arrowHead('fill-ink')}
      </>
    ),
    loop: (
      <>
        <path d="M18.5 12 C12 4 17 0 22 0 C27 0 32 4 25.5 12" strokeWidth={1.5} className="fill-none stroke-ink" />
        <circle cx={22} cy={15} r={6} strokeWidth={1.5} className="fill-paper stroke-ink" />
      </>
    ),
    now: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={2.2} strokeDasharray="6 4" className="stroke-marker" />
        {arrowHead('fill-marker')}
      </>
    ),
    missing: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={2} strokeDasharray="3 4" className="stroke-marker" />
        <path d="M40 11 L30.7 7.3 L30.7 14.7 Z" strokeWidth={1.4} className="fill-none stroke-marker" />
      </>
    ),
    path: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={2.8} className="stroke-ink" />
        {arrowHead('fill-ink')}
      </>
    ),
    line: <line x1={10} x2={34} y1={19} y2={3} strokeWidth={1.6} className="stroke-ink" />,
    lit: <rect x={7} y={4} width={30} height={14} rx={7} strokeWidth={1.4} className="fill-highlight stroke-ink" />,
    focus: <rect x={7} y={4} width={30} height={14} rx={7} strokeWidth={2.2} className="fill-highlight stroke-marker" />,
    ring: (
      <>
        <rect x={3} y={1} width={38} height={20} rx={10} strokeWidth={1.8} className="fill-none stroke-ink" />
        <rect x={8} y={5} width={28} height={12} rx={6} strokeWidth={1.4} className="fill-highlight stroke-ink" />
      </>
    ),
  }

  const shown = current === null ? null : steps[current]

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
            <span className="text-[17px]">
              <MathText text={t(`statements.${sampleKey}`)} />
            </span>
            {stamps()}
          </div>
          {figure()}
          <div className="mt-3">
            <InequalityStepsTable rows={rows} stepHeader={t('table.step')} testHeader="" verdicts={null} markTest />
          </div>
          <p data-reading className="mt-2.5 min-h-[1.6em] text-[17px] [&_.katex]:text-[1.15em]!">
            <MathText text={shown ? shown.caption : idleReading()} />
          </p>
        </TitledCard>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={shown && <MathText text={shown.caption} />}
          idleText={t(group === 'partial' ? 'idle.play' : 'idle.pick')}
        />
      }
      stage={<div className="grid gap-6 sm:grid-cols-2">{cards}</div>}
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
