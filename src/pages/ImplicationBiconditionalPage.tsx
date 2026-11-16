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
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { deciderRingClass, TruthTableBoard, type TruthRow } from '../components/organisms/TruthTableBoard'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'

type ConnectiveKey = 'implication' | 'biconditional'
type DirectionKey = ConnectiveKey | 'converse'

type Connective = {
  symbolTex: string
  resultTex: string
  apply: (values: boolean[]) => boolean
}

const connectiveKeys: ConnectiveKey[] = ['implication', 'biconditional']
const delays = [0.5, 1, 1.5, 2, 3]
const inputsTex = ['P', 'Q']
const rowValues = [
  [true, true],
  [true, false],
  [false, true],
  [false, false],
]
const evenExampleValues = [true, false, false, true]

const implies = ([premise, conclusion]: boolean[]) => !premise || conclusion
const iff = ([left, right]: boolean[]) => left === right

const connectives: Record<ConnectiveKey, Connective> = {
  implication: { symbolTex: '\\Rightarrow', resultTex: 'P \\Rightarrow Q', apply: implies },
  biconditional: { symbolTex: '\\Leftrightarrow', resultTex: 'P \\Leftrightarrow Q', apply: iff },
}

const directions: { key: DirectionKey; tex: string; apply: (values: boolean[]) => boolean; split: boolean }[] = [
  { key: 'implication', tex: 'P \\Rightarrow Q', apply: implies, split: true },
  { key: 'converse', tex: 'Q \\Rightarrow P', apply: ([left, right]) => implies([right, left]), split: false },
  { key: 'biconditional', tex: 'P \\Leftrightarrow Q', apply: iff, split: true },
]

function deciders(key: ConnectiveKey, values: boolean[]) {
  if (key === 'biconditional') return []
  if (!implies(values)) return [0, 1]
  const [premise, conclusion] = values
  return [...(premise ? [] : [0]), ...(conclusion ? [1] : [])]
}

function implicationReason([premise, conclusion]: boolean[]) {
  if (premise && !conclusion) return 'broken'
  if (!premise && conclusion) return 'premiseFalseConclusionTrue'
  if (!premise) return 'premiseFalse'
  return 'conclusionTrue'
}

export function ImplicationBiconditionalPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.implicationBiconditional' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const { t: tRoot } = useTranslation()
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('implicationBiconditional')
  const [tab, setTab] = useState<ConnectiveKey>('implication')
  const [selection, setSelection] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const connective = connectives[tab]
  const player = useStepPlayer({ steps: rowValues.length, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const picked = current === null ? selection : null
  const active = current ?? selection
  const filled = (row: number) => current === null || row <= current
  const activeFilled = active !== null && filled(active)
  const activeResult = activeFilled ? connective.apply(rowValues[active]) : null
  const truth = (value: boolean) => tRoot(value ? 'truthValues.true' : 'truthValues.false')
  const text = (key: 'context' | 'meaningHead' | 'definition' | 'intro') => t(`connectives.${tab}.${key}`)
  const lines = (key: 'suppose' | 'meanings' | 'readings' | 'reading') =>
    t(`connectives.${tab}.${key}`, { returnObjects: true })
  const meanings = lines('meanings')
  const evenExamples = t('examples.items', { returnObjects: true })

  function choose(next: ConnectiveKey) {
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

  function caption(row: number) {
    const values = rowValues[row]
    const result = connective.apply(values)
    const assign = inputsTex.map((name, index) => `$${name}$ = ${truth(values[index])}`).join(', ')
    const reason = tab === 'implication' ? implicationReason(values) : result ? 'same' : 'different'
    return t('caption', {
      row: row + 1,
      assign,
      reason: t(`reasons.${reason}`),
      expression: connective.resultTex,
      result: truth(result),
    })
  }

  const rows: TruthRow[] = rowValues.map((values, row) => ({
    values,
    result: connective.apply(values),
    filled: filled(row),
    deciders: row === active && filled(row) ? deciders(tab, values) : [],
    meaning: meanings[row],
    who: '',
  }))

  const splitClass = (split: boolean) => (split ? 'border-l-[1.5px] border-ink' : '')

  function directionsCard() {
    return (
      <TitledCard title={t('cards.directions')}>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="border-collapse text-center">
            <thead>
              <tr>
                {inputsTex.map((name) => (
                  <th key={name} className="border-b-[1.5px] border-ink px-1.5 py-1.5 font-normal">
                    <MathTex tex={name} />
                  </th>
                ))}
                {directions.map((direction) => (
                  <th
                    key={direction.key}
                    className={`border-b-[1.5px] border-ink px-1.5 py-1.5 font-normal whitespace-nowrap ${splitClass(direction.split)}`}
                  >
                    <MathTex
                      tex={direction.tex}
                      className={direction.key === tab ? 'marker-highlight dark:text-paper' : ''}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowValues.map((values, row) => (
                <tr
                  key={row}
                  className={`font-hand text-[21px] font-bold ${row > 0 ? 'border-t border-dashed border-faint' : ''} ${row === active && filled(row) ? 'bg-highlight-soft' : ''}`}
                >
                  {values.map((value, index) => (
                    <td key={index} className="px-1.5 py-1.5">
                      {truth(value)}
                    </td>
                  ))}
                  {directions.map((direction) => {
                    const result = direction.apply(values)
                    return (
                      <td
                        key={direction.key}
                        className={`px-1.5 py-1.5 ${splitClass(direction.split)} ${result ? '' : 'text-marker'} ${direction.key === tab ? 'text-2xl' : 'opacity-55'}`}
                      >
                        {truth(result)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('directions.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function whenCard() {
    const cellClass = 'border-t border-dashed border-faint py-3.5 pr-4.5 align-top text-[15px]'
    return (
      <TitledCard title={t('cards.when')}>
        <table className="border-collapse text-left">
          <thead>
            <tr>
              <th />
              <th className="py-3.5 pr-4.5 font-hand text-[21px] leading-tight font-bold">{t('when.toBeTrue')}</th>
              <th className="py-3.5 pr-4.5 font-hand text-[21px] leading-tight font-bold">{t('when.toBeFalse')}</th>
            </tr>
          </thead>
          <tbody>
            {connectiveKeys.map((key) => (
              <tr key={key}>
                <th className="border-t border-dashed border-faint py-3.5 pr-4.5 align-top font-normal">
                  <MathTex tex={connectives[key].symbolTex} />
                </th>
                {([true, false] as const).map((value) => (
                  <td
                    key={String(value)}
                    className={`${cellClass} ${key === tab && activeResult === value ? 'bg-highlight-soft' : ''}`}
                  >
                    <MathText text={t(`when.${key}.${value ? 'true' : 'false'}`)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('when.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function untestedCard() {
    const lit = activeFilled && active >= 2
    return (
      <TitledCard title={t('cards.untested')} wide>
        <p className={`transition-colors duration-300 ${lit ? 'bg-highlight-soft' : ''}`}>
          <MathText text={t('untested.body')} />
        </p>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('untested.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function examplesCard() {
    const cellClass = 'py-3.5 pr-4.5 align-top text-[15px]'
    return (
      <TitledCard title={t('cards.examples')} wide>
        <p className="mb-3 text-[15px] text-muted">{t('examples.universe')}</p>
        <table className="border-collapse text-left">
          <tbody>
            {evenExamples.map((example, index) => {
              const value = evenExampleValues[index]
              const rule = index > 0 ? 'border-t border-dashed border-faint' : ''
              return (
                <tr key={example.text}>
                  <td className={`${cellClass} ${rule}`}>
                    <span
                      data-example={value ? 'true' : 'false'}
                      className={`px-2 font-hand text-[21px] leading-none font-bold ${value ? 'bg-highlight dark:text-paper' : 'text-marker'}`}
                    >
                      {truth(value)}
                    </span>
                  </td>
                  <td className={`${cellClass} ${rule}`}>
                    {example.text}
                    <span className="mt-1.5 block text-muted">{example.remark}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TitledCard>
    )
  }

  const swatchClass = 'relative flex h-6 w-8.5 items-center justify-center font-hand text-xl font-bold'

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup
            options={connectiveKeys.map((key) => ({ value: key, label: t(`connectives.${key}.tab`) }))}
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
        <TitledCard title={<MathText text={t('board', { expression: connective.resultTex })} />}>
          <div className="mb-5.5 grid grid-cols-[auto_1fr] items-baseline gap-x-4">
            <span className="font-hand text-[21px] leading-none text-muted">{t('suppose')}</span>
            <div className="grid gap-1.5">
              {text('context') && <p className="text-[15px] text-muted">{text('context')}</p>}
              {lines('suppose').map((line) => (
                <p key={line}>
                  <MarkedText text={line} />
                </p>
              ))}
            </div>
          </div>
          <TruthTableBoard
            inputsTex={inputsTex}
            resultTex={connective.resultTex}
            rowHead={t('rowHead')}
            meaningHead={text('meaningHead')}
            rows={rows}
            active={active}
            picked={picked}
            interactive={!player.playing}
            truthLabel={truth}
            rowLabel={(row) => t('rowLabel', { row: row + 1 })}
            onPick={select}
          />
        </TitledCard>
      }
      progress={
        <StepProgress
          total={rowValues.length}
          current={current}
          caption={current !== null && <MathText text={caption(current)} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-6 sm:grid-cols-2">
          <TitledCard title={t('cards.definition')}>
            <p>
              <MathText text={text('definition')} />
            </p>
          </TitledCard>
          <TitledCard title={t('cards.reading')}>
            {lines('reading').map((line, index) => (
              <p key={line} className={index > 0 ? 'mt-3' : ''}>
                <MathText text={line} />
              </p>
            ))}
          </TitledCard>
          {directionsCard()}
          {whenCard()}
          {tab === 'implication' ? untestedCard() : examplesCard()}
        </div>
      }
      detail={
        <NoteCard>
          {picked !== null ? (
            <p>
              <strong>{t('rowLabel', { row: picked + 1 })}</strong> <MathText text={lines('readings')[picked]} />
            </p>
          ) : (
            <>
              <p className="mb-3.5">
                <MathText text={text('intro')} />
              </p>
              <p className="text-muted">{t('hint')}</p>
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
            {tab === 'implication' && (
              <div className="contents">
                <dt className={`${swatchClass} h-7.5`}>
                  {truth(false)}
                  <span aria-hidden="true" className={deciderRingClass} />
                </dt>
                <dd className="text-muted">{t('legend.decider')}</dd>
              </div>
            )}
            {connectiveKeys.map((key) => (
              <div key={key} className="contents">
                <dt className="flex w-8.5 justify-center">
                  <MathTex tex={connectives[key].symbolTex} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">{t(`legend.${key}`)}</dd>
              </div>
            ))}
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
