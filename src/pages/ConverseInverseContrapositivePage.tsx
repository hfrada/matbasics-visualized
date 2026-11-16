import { useState } from 'react'
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
import { ComparisonTableBoard, type ComparisonRow } from '../components/organisms/ComparisonTableBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { deciderRingClass } from '../components/organisms/TruthTableBoard'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'

type FormKey = 'converse' | 'inverse' | 'contrapositive'
type CornerKey = 'implication' | FormKey
type ColumnKey = 'p' | 'q' | 'notP' | 'notQ'
type EdgeKey = 'top' | 'left' | 'right' | 'bottom'

type Corner = {
  tex: string
  premise: ColumnKey
  conclusion: ColumnKey
}

const formKeys: FormKey[] = ['converse', 'inverse', 'contrapositive']
const cornerKeys: CornerKey[] = ['implication', 'converse', 'inverse', 'contrapositive']
const delays = [0.5, 1, 1.5, 2, 3]
const rowValues = [
  [true, true],
  [true, false],
  [false, true],
  [false, false],
]

const columnTex: Record<ColumnKey, string> = { p: 'P', q: 'Q', notP: '\\neg P', notQ: '\\neg Q' }
const columnValue: Record<ColumnKey, (values: boolean[]) => boolean> = {
  p: ([p]) => p,
  q: ([, q]) => q,
  notP: ([p]) => !p,
  notQ: ([, q]) => !q,
}

const corners: Record<CornerKey, Corner> = {
  implication: { tex: 'P \\Rightarrow Q', premise: 'p', conclusion: 'q' },
  converse: { tex: 'Q \\Rightarrow P', premise: 'q', conclusion: 'p' },
  inverse: { tex: '\\neg P \\Rightarrow \\neg Q', premise: 'notP', conclusion: 'notQ' },
  contrapositive: { tex: '\\neg Q \\Rightarrow \\neg P', premise: 'notQ', conclusion: 'notP' },
}

const formColumns: Record<FormKey, ColumnKey[]> = {
  converse: ['p', 'q'],
  inverse: ['p', 'q', 'notP', 'notQ'],
  contrapositive: ['p', 'q', 'notP', 'notQ'],
}

const formPaths: Record<FormKey, EdgeKey[]> = {
  converse: ['top'],
  inverse: ['left'],
  contrapositive: ['top', 'right'],
}

const implies = (premise: boolean, conclusion: boolean) => !premise || conclusion
const valueOf = (key: CornerKey, values: boolean[]) =>
  implies(columnValue[corners[key].premise](values), columnValue[corners[key].conclusion](values))
const falseRowOf = (key: CornerKey) => rowValues.findIndex((values) => !valueOf(key, values))

function deciders(key: FormKey, values: boolean[]) {
  const { premise, conclusion } = corners[key]
  const premiseValue = columnValue[premise](values)
  const conclusionValue = columnValue[conclusion](values)
  const ringed: ColumnKey[] = !implies(premiseValue, conclusionValue)
    ? [premise, conclusion]
    : [...(premiseValue ? [] : [premise]), ...(conclusionValue ? [conclusion] : [])]
  return ringed.map((column) => formColumns[key].indexOf(column))
}

function implicationReason(premise: boolean, conclusion: boolean) {
  if (premise && !conclusion) return 'broken'
  if (!premise && conclusion) return 'premiseFalseConclusionTrue'
  if (!premise) return 'premiseFalse'
  return 'conclusionTrue'
}

export function ConverseInverseContrapositivePage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.converseInverseContrapositive' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const { t: tRoot } = useTranslation()
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('converseInverseContrapositive')
  const [tab, setTab] = useState<FormKey>('converse')
  const [selection, setSelection] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const form = corners[tab]
  const player = useStepPlayer({ steps: rowValues.length + 1, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const comparing = current === rowValues.length
  const picked = current === null ? selection : null
  const active = comparing ? null : (current ?? selection)
  const filled = (row: number) => current === null || row <= current
  const truth = (value: boolean) => tRoot(value ? 'truthValues.true' : 'truthValues.false')
  const situations = t('situations', { returnObjects: true })

  function choose(next: FormKey) {
    player.stop()
    setSelection(null)
    setTab(next)
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

  function reason(row: number) {
    const values = rowValues[row]
    const premise = columnValue[form.premise](values)
    const conclusion = columnValue[form.conclusion](values)
    return t(`reasons.${implicationReason(premise, conclusion)}`, {
      premise: columnTex[form.premise],
      conclusion: columnTex[form.conclusion],
    })
  }

  function caption(step: number) {
    if (step === rowValues.length) return t(`forms.${tab}.verdict`)
    const values = rowValues[step]
    const implication = valueOf('implication', values)
    return t('caption', {
      row: step + 1,
      reason: reason(step),
      expression: form.tex,
      result: truth(valueOf(tab, values)),
      comparison: t(valueOf(tab, values) === implication ? 'comparison.same' : 'comparison.different', {
        value: truth(implication),
      }),
    })
  }

  function reading(row: number) {
    const values = rowValues[row]
    const implication = valueOf('implication', values)
    return t('reading', {
      situation: situations[row],
      reason: reason(row),
      expression: form.tex,
      result: truth(valueOf(tab, values)),
      implication: truth(implication),
      ending: t(valueOf(tab, values) === implication ? 'readingEnd.same' : 'readingEnd.different'),
    })
  }

  const rows: ComparisonRow[] = rowValues.map((values, row) => ({
    values: formColumns[tab].map((column) => columnValue[column](values)),
    given: valueOf('implication', values),
    result: valueOf(tab, values),
    filled: filled(row),
    deciders: row === active && filled(row) ? deciders(tab, values) : [],
  }))

  function definitionCard() {
    const lines = t('definition.lines', { returnObjects: true })
    return (
      <TitledCard title={t('cards.definition')}>
        <p className="mb-3">
          <MathText text={t('definition.intro')} />
        </p>
        {lines.map((line, index) => (
          <p
            key={line}
            className={`-mx-3 rounded-[3px] px-3 py-2 transition-[opacity,background-color] duration-300 ${index > 0 ? 'mt-1.5' : ''} ${formKeys[index] === tab ? 'bg-highlight-soft' : 'opacity-55'}`}
          >
            <MathText text={line} />
          </p>
        ))}
      </TitledCard>
    )
  }

  function readingCard() {
    const lines = t(`forms.${tab}.reading`, { returnObjects: true })
    return (
      <TitledCard title={t('cards.reading')}>
        {lines.map((line, index) => (
          <p key={line} className={index > 0 ? 'mt-3' : ''}>
            <MathText text={line} />
          </p>
        ))}
      </TitledCard>
    )
  }

  function falseRowCard() {
    const cellClass = 'border-t border-dashed border-faint py-3.5 align-top text-[15px] transition-opacity duration-300'
    const headClass = 'pb-3 font-hand text-[21px] leading-tight font-bold'
    return (
      <TitledCard title={t('cards.falseRow')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={`${headClass} pr-4 pl-2`}>{t('falseRow.form')}</th>
                <th className={`${headClass} pr-4`}>{t('falseRow.condition')}</th>
                <th className={`${headClass} px-2 text-center`}>{t('falseRow.row')}</th>
              </tr>
            </thead>
            <tbody>
              {cornerKeys.map((key) => {
                const tone = key === tab ? 'bg-highlight-soft' : key === 'implication' ? '' : 'opacity-50'
                const also = t(`falseRow.items.${key}.also`)
                return (
                  <tr key={key} data-false-row={key}>
                    <th className={`${cellClass} ${tone} pr-4 pl-2 font-normal whitespace-nowrap`}>
                      <MathTex tex={corners[key].tex} />
                    </th>
                    <td className={`${cellClass} ${tone} pr-4`}>
                      <MathText text={t(`falseRow.items.${key}.condition`)} />
                      {also && (
                        <span className="mt-1.5 block text-muted">
                          <MathText text={also} />
                        </span>
                      )}
                    </td>
                    <td className={`${cellClass} ${tone} px-2 text-center font-hand text-[22px] leading-[1.4] font-bold`}>
                      {falseRowOf(key) + 1}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">{t('falseRow.footnote')}</p>
      </TitledCard>
    )
  }

  function squareCard() {
    const path = formPaths[tab]
    const mainDiagonal = tab === 'contrapositive'

    function corner(key: CornerKey) {
      const tone = key === 'implication' || key === tab ? '' : 'opacity-55'
      return (
        <div
          data-corner={key}
          data-active={key === tab || undefined}
          className={`relative flex flex-col items-center gap-1.5 px-4 py-3 transition-opacity duration-300 ${tone}`}
        >
          <span className="font-hand text-xl leading-none text-muted">{t(`names.${key}`)}</span>
          <MathTex tex={corners[key].tex} className="text-[17px] whitespace-nowrap" />
          <span className="flex gap-0.5 font-hand text-[22px] leading-none font-bold">
            {rowValues.map((values, row) => {
              const value = valueOf(key, values)
              const lit = row === active && filled(row)
              return (
                <span
                  key={row}
                  className={`min-w-4.5 rounded-[3px] text-center ${value ? '' : 'text-marker'} ${lit ? 'bg-highlight-soft' : ''}`}
                >
                  {truth(value)}
                </span>
              )
            })}
          </span>
          {key === tab && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -inset-y-0.5 rounded-full border-2 border-marker" />
          )}
        </div>
      )
    }

    function edge(side: EdgeKey) {
      const on = path.includes(side)
      const horizontal = side === 'top' || side === 'bottom'
      const line = horizontal ? 'inset-x-0 top-1/2 border-t-2' : 'inset-y-0 left-1/2 border-l-2'
      return (
        <div data-edge={side} data-on={on || undefined} className="relative flex items-center justify-center">
          <span aria-hidden="true" className={`absolute ${line} ${on ? 'border-marker' : 'border-ink'}`} />
          <span className={`relative bg-paper px-1.5 py-0.5 font-hand text-xl leading-none ${on ? 'text-marker' : 'text-muted'}`}>
            {t(horizontal ? 'square.swap' : 'square.negate')}
          </span>
        </div>
      )
    }

    const diagonalClass = (on: boolean) =>
      on ? 'stroke-highlight' : 'stroke-faint'

    return (
      <TitledCard title={t('cards.square')} wide>
        <div className="mx-auto mt-1 grid max-w-[540px] grid-cols-[auto_minmax(48px,1fr)_auto] grid-rows-[auto_minmax(84px,auto)_auto]">
          {corner('implication')}
          {edge('top')}
          {corner('converse')}
          {edge('left')}
          <div className="relative">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-0 size-full overflow-visible"
            >
              {[
                { on: mainDiagonal, points: [4, 4, 96, 96] },
                { on: !mainDiagonal, points: [96, 4, 4, 96] },
              ].map(({ on, points: [x1, y1, x2, y2] }) => (
                <line
                  key={x1}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={on ? 7 : 1.5}
                  strokeDasharray={on ? undefined : '5 5'}
                  strokeLinecap="round"
                  className={diagonalClass(on)}
                />
              ))}
            </svg>
          </div>
          {edge('right')}
          {corner('inverse')}
          {edge('bottom')}
          {corner('contrapositive')}
        </div>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('square.footnote')} />
        </p>
      </TitledCard>
    )
  }

  const swatchClass = 'relative flex h-6 w-8.5 items-center justify-center font-hand text-xl font-bold'
  const legendSymbols: { key: 'same' | 'different' | 'negation' | 'implication'; tex: string; tone: string }[] = [
    { key: 'same', tex: '=', tone: '' },
    { key: 'different', tex: '\\neq', tone: 'text-marker' },
    { key: 'negation', tex: '\\neg', tone: '' },
    { key: 'implication', tex: '\\Rightarrow', tone: '' },
  ]

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup
            options={formKeys.map((key) => ({ value: key, label: t(`names.${key}`) }))}
            value={tab}
            onChange={choose}
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
      board={
        <TitledCard title={<MathText text={t('board', { expression: form.tex })} />}>
          <div className="mb-5.5 grid grid-cols-[auto_1fr] items-baseline gap-x-4">
            <span className="font-hand text-[21px] leading-none text-muted">{t('suppose')}</span>
            <div className="grid gap-1.5">
              {[...t('supposeLines', { returnObjects: true }), t(`forms.${tab}.sentence`)].map((line) => (
                <p key={line}>
                  <MarkedText text={line} />
                </p>
              ))}
            </div>
          </div>
          <div className="relative overflow-x-auto overflow-y-hidden">
            <ComparisonTableBoard
              inputsTex={formColumns[tab].map((column) => columnTex[column])}
              givenTex={corners.implication.tex}
              givenName={t('names.implication')}
              resultTex={form.tex}
              resultName={t(`names.${tab}`)}
              sameHead={t('sameHead')}
              rowHead={t('rowHead')}
              rows={rows}
              active={active}
              picked={picked}
              interactive={!player.playing}
              comparing={comparing}
              truthLabel={truth}
              rowLabel={(row) => t('rowLabel', { row: row + 1 })}
              onPick={select}
            />
          </div>
        </TitledCard>
      }
      progress={
        <StepProgress
          total={rowValues.length + 1}
          current={current}
          caption={current !== null && <MathText text={caption(current)} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-6 sm:grid-cols-2">
          {definitionCard()}
          {readingCard()}
          {falseRowCard()}
          {squareCard()}
        </div>
      }
      detail={
        <NoteCard>
          {picked !== null ? (
            <p>
              <strong>{t('rowLabel', { row: picked + 1 })}</strong> <MathText text={reading(picked)} />
            </p>
          ) : (
            <>
              <p className="mb-3.5">
                <MathText text={t(`forms.${tab}.intro`)} />
              </p>
              <p className="text-muted">
                <MathText text={t('hint')} />
              </p>
            </>
          )}
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
              <dt className={`${swatchClass} h-7.5`}>
                {truth(false)}
                <span aria-hidden="true" className={deciderRingClass} />
              </dt>
              <dd className="text-muted">{t('legend.decider')}</dd>
            </div>
            {legendSymbols.map((symbol) => (
              <div key={symbol.key} className="contents">
                <dt className={`flex w-8.5 justify-center ${symbol.tone}`}>
                  <MathTex tex={symbol.tex} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">{t(`legend.${symbol.key}`)}</dd>
              </div>
            ))}
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
