import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MarkedText } from '../components/atoms/MarkedText'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { Title } from '../components/atoms/Title'
import { NoteCard } from '../components/molecules/NoteCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PlayButton } from '../components/molecules/PlayButton'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { TitledCard } from '../components/molecules/TitledCard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { ExpressionTree } from '../components/organisms/ExpressionTree'
import { LayeredTableBoard, type LayeredColumn } from '../components/organisms/LayeredTableBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  biconditional,
  buildOrder,
  conjunction,
  connectiveGlyph,
  connectivesOf,
  connectiveTex,
  disjunction,
  evaluate,
  expressionTex,
  implication,
  letter,
  lettersOf,
  negation,
  partsOf,
  truthRows,
  type LogicExpression,
  type TruthAssignment,
} from '../lib/logicExpression'

type ModeKey = 'layered' | 'equivalence'
type LayeredKey =
  | 'bothNegated'
  | 'conjunctionOrNegation'
  | 'disjunctionImpliesConjunction'
  | 'disjunctionIffNegatedConjunction'
  | 'threeLetters'
type EquivalenceKey = 'negatedImplication' | 'deMorgan' | 'implicationAsDisjunction' | 'onlyQ' | 'notDeMorgan'
type PairKey = EquivalenceKey | 'contrapositive'
type SideKey = 'main' | 'left' | 'right'

type Side = {
  key: SideKey
  expression: LogicExpression
}

type SheetColumn = {
  key: string
  side: SideKey
  expression: LogicExpression
  tex: string
  step: number | null
  final: boolean
}

type Sheet = {
  sides: Side[]
  letters: string[]
  rows: TruthAssignment[]
  columns: SheetColumn[]
  steps: number
  compare: boolean
}

const P = letter('P')
const Q = letter('Q')
const R = letter('R')

const modeKeys: ModeKey[] = ['layered', 'equivalence']
const layeredKeys: LayeredKey[] = [
  'bothNegated',
  'conjunctionOrNegation',
  'disjunctionImpliesConjunction',
  'disjunctionIffNegatedConjunction',
  'threeLetters',
]
const equivalenceKeys: EquivalenceKey[] = ['negatedImplication', 'deMorgan', 'implicationAsDisjunction', 'onlyQ', 'notDeMorgan']
const pairKeys: PairKey[] = ['negatedImplication', 'deMorgan', 'implicationAsDisjunction', 'onlyQ', 'contrapositive', 'notDeMorgan']
const delays = [0.5, 1, 1.5, 2, 3]
const pairRows = truthRows(['P', 'Q'])
const unknownEquivalence = '\\overset{?}{\\equiv}'

const layeredExamples: Record<LayeredKey, LogicExpression> = {
  bothNegated: conjunction(negation(P), negation(Q)),
  conjunctionOrNegation: disjunction(conjunction(P, Q), negation(P)),
  disjunctionImpliesConjunction: implication(disjunction(P, Q), conjunction(P, Q)),
  disjunctionIffNegatedConjunction: biconditional(disjunction(P, Q), negation(conjunction(P, Q))),
  threeLetters: implication(R, disjunction(P, Q)),
}

const equivalencePairs: Record<PairKey, [LogicExpression, LogicExpression]> = {
  negatedImplication: [conjunction(P, negation(Q)), negation(implication(P, Q))],
  deMorgan: [negation(conjunction(P, Q)), disjunction(negation(P), negation(Q))],
  implicationAsDisjunction: [implication(P, Q), disjunction(negation(P), Q)],
  onlyQ: [Q, implication(disjunction(P, negation(Q)), Q)],
  contrapositive: [implication(P, Q), implication(negation(Q), negation(P))],
  notDeMorgan: [negation(conjunction(P, Q)), conjunction(negation(P), negation(Q))],
}

const letterCountExamples = [negation(P), conjunction(P, Q), layeredExamples.threeLetters]

const lookups: { expression: LogicExpression; values: TruthAssignment }[] = [
  { expression: implication(negation(Q), negation(P)), values: { P: true, Q: true } },
  { expression: disjunction(P, negation(Q)), values: { P: true, Q: true } },
]

function sheetColumn(side: SideKey, expression: LogicExpression, step: number | null, final: boolean): SheetColumn {
  const tex = expressionTex(expression)
  return { key: `${side}:${tex}`, side, expression, tex, step, final }
}

function sheetOf(sides: Side[]): Sheet {
  const letters = lettersOf(sides.map((side) => side.expression))
  const columns: SheetColumn[] = []
  for (const side of sides) {
    const order = buildOrder(side.expression)
    if (order.length === 0) columns.push(sheetColumn(side.key, side.expression, null, true))
    order.forEach((expression, index) =>
      columns.push(sheetColumn(side.key, expression, columns.filter((column) => column.step !== null).length, index === order.length - 1)),
    )
  }
  const steps = columns.filter((column) => column.step !== null).length
  return { sides, letters, rows: truthRows(letters), columns, steps, compare: sides.length > 1 }
}

const layeredSheets = Object.fromEntries(
  layeredKeys.map((key) => [key, sheetOf([{ key: 'main', expression: layeredExamples[key] }])]),
) as Record<LayeredKey, Sheet>

const equivalenceSheets = Object.fromEntries(
  equivalenceKeys.map((key) => {
    const [left, right] = equivalencePairs[key]
    return [key, sheetOf([{ key: 'left', expression: left }, { key: 'right', expression: right }])]
  }),
) as Record<EquivalenceKey, Sheet>

const cellClass = 'border-t border-dashed border-faint py-3.5 align-top text-[15px] transition-opacity duration-300'
const headClass = 'pb-3 font-hand text-[21px] leading-tight font-bold'
const stepNumberClass = 'font-hand text-[22px] leading-[1.4] font-bold'

export function LayeredTablesAndEquivalencePage() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'topics.layeredTablesAndEquivalence' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const { t: tRoot } = useTranslation()
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('layeredTablesAndEquivalence')
  const [mode, setMode] = useState<ModeKey>('layered')
  const [layeredTab, setLayeredTab] = useState<LayeredKey>('bothNegated')
  const [equivalenceTab, setEquivalenceTab] = useState<EquivalenceKey>('negatedImplication')
  const [selection, setSelection] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const sheet = mode === 'layered' ? layeredSheets[layeredTab] : equivalenceSheets[equivalenceTab]
  const total = sheet.steps + (sheet.compare ? 1 : 0)
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const comparing = sheet.compare && current === sheet.steps
  const sameShown = sheet.compare && (current === null || current >= sheet.steps)
  const picked = current === null ? selection : null
  const now = sheet.columns.find((column) => current !== null && column.step === current) ?? null
  const finals = sheet.columns.filter((column) => column.final)
  const stepColumns = sheet.columns.flatMap((column) => (column.step === null ? [] : [{ ...column, step: column.step }]))
  const sideTex = sheet.sides.map((side) => expressionTex(side.expression))

  const truth = (value: boolean) => tRoot(value ? 'truthValues.true' : 'truthValues.false')
  const list = (items: string[]) => new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(items)
  const sideName = (side: SideKey) => t(side === 'right' ? 'sides.right' : 'sides.left')
  const sourcesOf = (expression: LogicExpression) => list(partsOf(expression).map((part) => `$${expressionTex(part)}$`))
  const filled = (column: SheetColumn) => current === null || column.step === null || column.step <= current
  const sameAt = (values: TruthAssignment) =>
    !sheet.compare || evaluate(finals[0].expression, values) === evaluate(finals[1].expression, values)
  const differing = sheet.rows.flatMap((values, row) => (sameAt(values) ? [] : [row + 1]))
  const sign = !sameShown ? unknownEquivalence : differing.length ? '\\not\\equiv' : '\\equiv'
  const feeding = new Set(
    now
      ? partsOf(now.expression).map((part) =>
          part.kind === 'letter' ? `letter:${part.name}` : `${now.side}:${expressionTex(part)}`,
        )
      : [],
  )

  function chooseMode(next: ModeKey) {
    player.stop()
    setSelection(null)
    setMode(next)
  }

  function chooseLayered(next: LayeredKey) {
    player.stop()
    setSelection(null)
    setLayeredTab(next)
  }

  function chooseEquivalence(next: EquivalenceKey) {
    player.stop()
    setSelection(null)
    setEquivalenceTab(next)
  }

  function select(row: number) {
    setSelection((value) => (value === row ? null : row))
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelection(null)
    player.start()
  }

  function stepOf(side: SideKey, expression: LogicExpression) {
    const tex = expressionTex(expression)
    return sheet.columns.find((column) => column.side === side && column.tex === tex)?.step ?? 0
  }

  function verdict() {
    const [left, right] = sideTex
    return differing.length
      ? t('verdict.different', { left, right, rows: list(differing.map(String)) })
      : t('verdict.same', { left, right })
  }

  function caption(step: number) {
    if (step === sheet.steps) return verdict()
    const column = sheet.columns.find((item) => item.step === step)
    if (!column || column.expression.kind === 'letter') return ''
    const connective = column.expression.kind
    const options = {
      step: step + 1,
      expression: column.tex,
      sources: sourcesOf(column.expression),
      connective: connectiveTex[connective],
      rule: t(`rules.${connective}`),
      values: sheet.rows.map((values) => truth(evaluate(column.expression, values))).join(' '),
    }
    return sheet.compare ? t('sideCaption', { ...options, side: sideName(column.side) }) : t('caption', options)
  }

  const tableColumns: LayeredColumn[] = sheet.columns.map((column, index) => ({
    key: column.key,
    tex: column.tex,
    step: column.step,
    final: column.final,
    split: index === 0 || column.side !== sheet.columns[index - 1].side,
    filled: filled(column),
    feeds: feeding.has(column.key),
    now: column === now,
    highlighted: column === now || (comparing && column.final),
  }))

  function exampleTabs() {
    if (mode === 'layered') {
      return (
        <TabGroup
          options={layeredKeys.map((key) => ({
            value: key,
            label: <MathTex tex={expressionTex(layeredExamples[key])} className="text-[0.8em]" />,
          }))}
          value={layeredTab}
          onChange={chooseLayered}
        />
      )
    }
    return (
      <TabGroup
        options={equivalenceKeys.map((key) => {
          const [left, right] = equivalencePairs[key]
          return {
            value: key,
            label: (
              <MathTex
                tex={`${expressionTex(left)} ${unknownEquivalence} ${expressionTex(right)}`}
                className="text-[0.8em]"
              />
            ),
          }
        })}
        value={equivalenceTab}
        onChange={chooseEquivalence}
      />
    )
  }

  function orderCard() {
    return (
      <TitledCard title={t('cards.order')}>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={`${headClass} px-2 text-center`}>{t('order.step')}</th>
                <th className={`${headClass} pr-2.5`}>{t('order.column')}</th>
              </tr>
            </thead>
            <tbody>
              {stepColumns.map((column) => {
                const tone =
                  column.key === now?.key ? 'bg-highlight-soft' : current !== null && column.step > current ? 'opacity-50' : ''
                return (
                  <tr key={column.key} data-order-step={column.step + 1}>
                    <td className={`${cellClass} ${tone} ${stepNumberClass} px-2 text-center`}>{column.step + 1}</td>
                    <th className={`${cellClass} ${tone} pr-2.5 font-normal`}>
                      <MathTex tex={column.tex} className="whitespace-nowrap" />
                      <span className="mt-1.5 block text-muted [&_.katex]:whitespace-nowrap">
                        <MathText text={t('order.uses', { sources: sourcesOf(column.expression) })} />
                      </span>
                    </th>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">{t('order.footnote')}</p>
      </TitledCard>
    )
  }

  function countCard() {
    const connectives = connectivesOf(sheet.sides[0].expression)
    return (
      <TitledCard title={t('cards.count')}>
        <p>
          <MathText
            text={t('count.connectives', {
              total: connectives.length,
              list: connectives.map((connective) => `$${connectiveTex[connective]}$`).join(', '),
            })}
          />
        </p>
        <div className="relative mt-3 overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={`${headClass} px-2 text-center`}>{t('count.letters')}</th>
                <th className={`${headClass} px-2 text-center`}>{t('count.rows')}</th>
                <th className={`${headClass} pr-2`}>{t('count.example')}</th>
              </tr>
            </thead>
            <tbody>
              {letterCountExamples.map((expression) => {
                const count = lettersOf([expression]).length
                const tone = count === sheet.letters.length ? 'bg-highlight-soft' : ''
                return (
                  <tr key={count} data-letter-count={count} data-lit={count === sheet.letters.length || undefined}>
                    <td className={`${cellClass} ${tone} ${stepNumberClass} px-2 text-center`}>{count}</td>
                    <td className={`${cellClass} ${tone} ${stepNumberClass} px-2 text-center`}>{2 ** count}</td>
                    <td className={`${cellClass} ${tone} pr-2 whitespace-nowrap`}>
                      <MathTex tex={expressionTex(expression)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('count.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function lookupCard() {
    const items = t('lookup.items', { returnObjects: true })
    return (
      <TitledCard title={t('cards.lookup')} wide>
        <div className="grid gap-x-9 gap-y-6.5 sm:grid-cols-2">
          {lookups.map((lookup, index) => {
            const letters = lettersOf([lookup.expression])
            const row =
              truthRows(letters).findIndex((values) => letters.every((name) => values[name] === lookup.values[name])) + 1
            const order = buildOrder(lookup.expression)
            const result = evaluate(lookup.expression, lookup.values)
            return (
              <div key={items[index].sentence} data-lookup={index}>
                <p>
                  "<MarkedText text={items[index].sentence} />"
                </p>
                <div className="mt-3 grid gap-2">
                  <span className="font-hand text-[21px] leading-none text-muted">{t('lookup.suppose')}</span>
                  {letters.map((name, position) => (
                    <p key={name}>
                      <MathText
                        text={t('lookup.known', {
                          letter: name,
                          name: items[index].names[position],
                          value: truth(lookup.values[name]),
                        })}
                      />
                    </p>
                  ))}
                  <p>
                    <MathText text={t('lookup.sentence', { expression: expressionTex(lookup.expression) })} />
                  </p>
                </div>
                <p className="mt-3">{t('lookup.row', { row })}</p>
                <div className="mt-2 grid gap-1">
                  {order.map((expression, position) => {
                    const value = evaluate(expression, lookup.values)
                    const tone =
                      position === order.length - 1 ? (value ? 'bg-highlight dark:text-paper' : 'text-marker') : ''
                    return (
                      <p key={expressionTex(expression)}>
                        <MathTex tex={expressionTex(expression)} className="text-[0.8em]" /> ={' '}
                        <span
                          className={`inline-block min-w-6.5 rounded-[3px] px-1.5 text-center font-hand text-[22px] leading-[1.3] font-bold ${tone}`}
                        >
                          {truth(value)}
                        </span>
                      </p>
                    )
                  })}
                </div>
                <p className="mt-3">{t(result ? 'lookup.result.true' : 'lookup.result.false')}</p>
              </div>
            )
          })}
        </div>
        <p className="mt-4.5 text-[15px] text-muted">{t('lookup.footnote')}</p>
      </TitledCard>
    )
  }

  function definitionCard() {
    return (
      <TitledCard title={t('cards.definition')}>
        <p className="-mx-3 rounded-[3px] bg-highlight-soft px-3 py-2">
          {t('definition.before')}
          <strong>{t('definition.term')}</strong>
          <MathText text={t('definition.after')} />
        </p>
        <p className="mt-3">
          <MathText text={t('definition.reading')} />
        </p>
      </TitledCard>
    )
  }

  function seriesCard() {
    const headCell = 'py-2 pr-3 text-left font-hand text-[19px] leading-none font-medium text-muted'
    const valueCell = (row: number) =>
      `px-0.75 py-2 text-center transition-colors duration-300 ${row === picked ? 'bg-highlight-soft' : ''}`
    const letterClass = 'relative inline-block min-w-6.5 font-hand text-2xl leading-[1.2] font-bold'
    return (
      <TitledCard title={t('cards.series')}>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="border-collapse">
            <tbody>
              <tr>
                <th className={headCell}>{t('series.row')}</th>
                {sheet.rows.map((_, row) => (
                  <td key={row} className={`${valueCell(row)} font-hand text-[19px] leading-none text-muted`}>
                    {row + 1}
                  </td>
                ))}
              </tr>
              {finals.map((column) => (
                <tr key={column.key}>
                  <th className="py-2 pr-3 text-left font-normal whitespace-nowrap">
                    <MathTex tex={column.tex} />
                  </th>
                  {sheet.rows.map((values, row) => {
                    const value = evaluate(column.expression, values)
                    return (
                      <td key={row} className={valueCell(row)}>
                        <span className={`${letterClass} ${filled(column) ? (value ? '' : 'text-marker') : 'opacity-20'}`}>
                          {filled(column) ? truth(value) : '?'}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="border-t border-dashed border-faint">
                <th className={headCell}>{t('series.same')}</th>
                {sheet.rows.map((values, row) => {
                  const same = sameAt(values)
                  return (
                    <td key={row} className={valueCell(row)}>
                      <span className={`${letterClass} ${sameShown ? (same ? '' : 'text-marker') : 'opacity-20'}`}>
                        {sameShown ? <MathTex tex={same ? '=' : '\\neq'} /> : '?'}
                        {comparing && !same && (
                          <span aria-hidden="true" className="absolute -inset-x-0.5 -inset-y-1 rounded-full border-2 border-marker" />
                        )}
                      </span>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('series.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function pairsCard() {
    return (
      <TitledCard title={t('cards.pairs')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={`${headClass} pr-4 pl-2`}>{t('pairs.pair')}</th>
                <th className={`${headClass} px-2 text-center`}>{t('pairs.values')}</th>
                <th className={`${headClass} pr-2`}>{t('pairs.reading')}</th>
              </tr>
            </thead>
            <tbody>
              {pairKeys.map((key) => {
                const [left, right] = equivalencePairs[key]
                const leftValues = pairRows.map((values) => truth(evaluate(left, values))).join('')
                const rightValues = pairRows.map((values) => truth(evaluate(right, values))).join('')
                const same = leftValues === rightValues
                const tone = mode === 'equivalence' && key === equivalenceTab ? 'bg-highlight-soft' : ''
                return (
                  <tr key={key} data-pair={key} data-lit={tone ? true : undefined}>
                    <th className={`${cellClass} ${tone} pr-4 pl-2 font-normal whitespace-nowrap ${same ? '' : 'text-marker'}`}>
                      <MathTex tex={`${expressionTex(left)} ${same ? '\\equiv' : '\\not\\equiv'} ${expressionTex(right)}`} />
                    </th>
                    <td className={`${cellClass} ${tone} ${stepNumberClass} px-2 text-center whitespace-nowrap`}>
                      {same ? (
                        leftValues
                      ) : (
                        <>
                          {leftValues} <span className="text-marker">{t('pairs.and')}</span> {rightValues}
                        </>
                      )}
                    </td>
                    <td className={`${cellClass} ${tone} pr-2`}>
                      <MathText text={t(`pairs.items.${key}`)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">{t('pairs.footnote')}</p>
      </TitledCard>
    )
  }

  function note() {
    if (picked !== null) {
      const values = sheet.rows[picked]
      const [left, right] = finals.map((column) => evaluate(column.expression, values))
      return (
        <>
          <p className="mb-3">
            <strong>{t('rowLabel', { row: picked + 1 })}</strong>{' '}
            <MathText text={`${sheet.letters.map((name) => `$${name}$ = ${truth(values[name])}`).join(', ')}.`} />
          </p>
          <ol className="mb-3.5 grid gap-1.5">
            {stepColumns.map((column) => (
              <li key={column.key} className="flex items-baseline gap-2.5">
                <span className="min-w-4.5 font-bold text-muted">{column.step + 1}</span>
                <span>
                  <MathTex tex={column.tex} className="text-[0.8em]" /> = {truth(evaluate(column.expression, values))}
                </span>
              </li>
            ))}
          </ol>
          <p>
            {sheet.compare ? (
              t(left === right ? 'reading.same' : 'reading.different', { left: truth(left), right: truth(right) })
            ) : (
              <MathText text={t('reading.result', { expression: sideTex[0], value: truth(left) })} />
            )}
          </p>
        </>
      )
    }
    const example = mode === 'layered' ? layeredTab : equivalenceTab
    const intro =
      mode === 'layered'
        ? t('intro.layered', { expression: sideTex[0], total: sheet.steps })
        : t('intro.equivalence')
    return (
      <>
        <p className="mb-3.5">
          <MathText text={`${intro} ${t(`examples.${example}`)}`} />
        </p>
        <p className="text-muted">{t(`hint.${mode}`)}</p>
      </>
    )
  }

  const swatchClass = 'relative flex h-6 w-8.5 items-center justify-center font-hand text-xl font-bold'
  const legendSymbols: { key: 'same' | 'different' | 'equivalent'; tex: string; tone: string }[] = [
    { key: 'same', tex: '=', tone: '' },
    { key: 'different', tex: '\\neq', tone: 'text-marker' },
    { key: 'equivalent', tex: '\\equiv', tone: '' },
  ]

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup
            options={modeKeys.map((key) => ({ value: key, label: t(`modes.${key}`) }))}
            value={mode}
            onChange={chooseMode}
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
          <div className="basis-full">{exampleTabs()}</div>
        </>
      }
      board={
        <TitledCard
          title={
            sheet.compare ? (
              <MathTex tex={`${sideTex[0]} ${sign} ${sideTex[1]}`} className="text-[0.9em]" />
            ) : (
              <MathText text={t('board', { expression: sideTex[0] })} />
            )
          }
        >
          <div className="mt-1.5 mb-5.5 flex flex-wrap items-center justify-center gap-x-9 gap-y-3">
            {sheet.sides.map((side, index) => (
              <Fragment key={side.key}>
                {index > 0 && <MathTex tex={sign} className="text-[30px]" />}
                <ExpressionTree
                  expression={side.expression}
                  stepOf={(expression) => stepOf(side.key, expression)}
                  current={current}
                  comparing={comparing}
                  values={picked === null ? null : sheet.rows[picked]}
                  truthLabel={truth}
                  label={sheet.compare ? t('treeSideLabel', { side: sideName(side.key) }) : t('treeLabel')}
                  caption={sheet.compare ? sideName(side.key) : undefined}
                />
              </Fragment>
            ))}
          </div>
          <div className="relative overflow-x-auto overflow-y-hidden">
            <LayeredTableBoard
              letters={sheet.letters.map((name) => ({ tex: name, feeds: feeding.has(`letter:${name}`) }))}
              columns={tableColumns}
              groups={
                sheet.compare
                  ? sheet.sides.map((side) => ({
                      label: sideName(side.key),
                      span: sheet.columns.filter((column) => column.side === side.key).length,
                    }))
                  : null
              }
              rows={sheet.rows.map((values) => ({
                letters: sheet.letters.map((name) => values[name]),
                cells: sheet.columns.map((column) => evaluate(column.expression, values)),
                same: sameAt(values),
              }))}
              sameHead={sheet.compare ? t('sameHead') : null}
              sameShown={sameShown}
              comparing={comparing}
              rowHead={t('rowHead')}
              stepHead={t('stepHead')}
              active={picked}
              picked={picked}
              interactive={!player.playing}
              truthLabel={truth}
              rowLabel={(row) => t('rowLabel', { row: row + 1 })}
              onPick={select}
            />
          </div>
        </TitledCard>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={current !== null && <MathText text={caption(current)} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-6 sm:grid-cols-2">
          {mode === 'layered' ? (
            <>
              {orderCard()}
              {countCard()}
              {lookupCard()}
            </>
          ) : (
            <>
              {definitionCard()}
              {seriesCard()}
              {pairsCard()}
            </>
          )}
        </div>
      }
      detail={
        <NoteCard>
          {note()}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 border-t border-dashed border-faint pt-3">
            <div className="contents">
              <dt className={`${swatchClass} bg-highlight dark:text-paper`}>{truth(true)}</dt>
              <dd className="text-muted">{t('legend.true')}</dd>
            </div>
            <div className="contents">
              <dt className={`${swatchClass} text-marker`}>{truth(false)}</dt>
              <dd className="text-muted">{t('legend.false')}</dd>
            </div>
            <div className="contents">
              <dt className={`${swatchClass} text-muted`}>2</dt>
              <dd className="text-muted">{t('legend.step')}</dd>
            </div>
            <div className="contents">
              <dt className={`${swatchClass} bg-highlight-soft font-normal`}>{truth(true)}</dt>
              <dd className="text-muted">{t('legend.feeds')}</dd>
            </div>
            {mode === 'layered' ? (
              <div className="contents">
                <dt className="flex w-8.5 justify-center">
                  <span className="flex size-7 items-center justify-center rounded-full border-2 border-ink bg-highlight font-math text-base dark:text-paper">
                    {connectiveGlyph.and}
                  </span>
                </dt>
                <dd className="text-muted">{t('legend.treeTrue')}</dd>
              </div>
            ) : (
              legendSymbols.map((symbol) => (
                <div key={symbol.key} className="contents">
                  <dt className={`flex w-8.5 justify-center ${symbol.tone}`}>
                    <MathTex tex={symbol.tex} className="text-[0.75em]" />
                  </dt>
                  <dd className="text-muted">{t(`legend.${symbol.key}`)}</dd>
                </div>
              ))
            )}
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
