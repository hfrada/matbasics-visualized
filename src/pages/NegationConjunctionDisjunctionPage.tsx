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

type ConnectiveKey = 'negation' | 'conjunction' | 'disjunction'
type CompoundKey = 'conjunction' | 'disjunction'

type Connective = {
  inputsTex: string[]
  resultTex: string
  rows: boolean[][]
  apply: (values: boolean[]) => boolean
}

const connectiveKeys: ConnectiveKey[] = ['negation', 'conjunction', 'disjunction']
const compoundKeys: CompoundKey[] = ['conjunction', 'disjunction']
const delays = [0.5, 1, 1.5, 2, 3]
const twoInputs = [
  [true, true],
  [true, false],
  [false, true],
  [false, false],
]
const negationLetters = ['P', 'Q', 'R']

const connectives: Record<ConnectiveKey, Connective> = {
  negation: { inputsTex: ['P'], resultTex: '\\neg P', rows: [[true], [false]], apply: ([value]) => !value },
  conjunction: {
    inputsTex: ['P', 'Q'],
    resultTex: 'P \\wedge Q',
    rows: twoInputs,
    apply: ([left, right]) => left && right,
  },
  disjunction: {
    inputsTex: ['P', 'Q'],
    resultTex: 'P \\vee Q',
    rows: twoInputs,
    apply: ([left, right]) => left || right,
  },
}

const symbolTex = [
  { key: 'not', tex: '\\neg' },
  { key: 'and', tex: '\\wedge' },
  { key: 'or', tex: '\\vee' },
] as const

function deciders(key: ConnectiveKey, values: boolean[]) {
  if (key === 'negation') return []
  const result = connectives[key].apply(values)
  return values.flatMap((value, index) => (value === result ? [index] : []))
}

export function NegationConjunctionDisjunctionPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.negationConjunctionDisjunction' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const { t: tRoot } = useTranslation()
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('negationConjunctionDisjunction')
  const [tab, setTab] = useState<ConnectiveKey>('negation')
  const [selection, setSelection] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const connective = connectives[tab]
  const player = useStepPlayer({ steps: connective.rows.length, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const picked = current === null ? selection : null
  const active = current ?? selection
  const filled = (row: number) => current === null || row <= current
  const activeResult = active !== null && filled(active) ? connective.apply(connective.rows[active]) : null
  const truth = (value: boolean) => tRoot(value ? 'truthValues.true' : 'truthValues.false')
  const text = (key: 'context' | 'meaningHead' | 'definition' | 'intro') => t(`connectives.${tab}.${key}`)
  const lines = (key: 'suppose' | 'meanings' | 'who' | 'readings' | 'reading') =>
    t(`connectives.${tab}.${key}`, { returnObjects: true })
  const meanings = lines('meanings')
  const who = lines('who')
  const examples = t('examples', { returnObjects: true })

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

  function assignment(values: boolean[]) {
    return connective.inputsTex.map((name, index) => `$${name}$ = ${truth(values[index])}`).join(', ')
  }

  function caption(row: number) {
    const values = connective.rows[row]
    const result = connective.apply(values)
    const shared = { row: row + 1, assign: assignment(values), result: truth(result) }
    if (tab === 'negation') return t('captions.negation', shared)
    const same = values.filter((value) => value === result).length
    let reason: 'bothTrue' | 'bothFalse' | 'oneTrue' | 'oneFalse'
    if (same === 2) reason = result ? 'bothTrue' : 'bothFalse'
    else reason = result ? 'oneTrue' : 'oneFalse'
    return t('captions.compound', { ...shared, reason: t(`reasons.${reason}`), expression: connective.resultTex })
  }

  const rows: TruthRow[] = connective.rows.map((values, row) => ({
    values,
    result: connective.apply(values),
    filled: filled(row),
    deciders: row === active && filled(row) ? deciders(tab, values) : [],
    meaning: meanings[row],
    who: who[row],
  }))

  function sideBySideCard() {
    return (
      <TitledCard title={<MathText text={t('cards.sideBySide')} />}>
        <table className="border-collapse text-center">
          <thead>
            <tr>
              {['P', 'Q'].map((name) => (
                <th key={name} className="border-b-[1.5px] border-ink px-3.5 py-1.5 font-normal">
                  <MathTex tex={name} />
                </th>
              ))}
              {compoundKeys.map((key) => (
                <th
                  key={key}
                  className={`border-b-[1.5px] border-ink px-3.5 py-1.5 font-normal ${key === 'conjunction' ? 'border-l-[1.5px]' : ''}`}
                >
                  <MathTex
                    tex={connectives[key].resultTex}
                    className={key === tab ? 'marker-highlight dark:text-paper' : ''}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {twoInputs.map((values, row) => (
              <tr
                key={row}
                className={`font-hand text-[21px] font-bold ${row > 0 ? 'border-t border-dashed border-faint' : ''} ${row === active && filled(row) ? 'bg-highlight-soft' : ''}`}
              >
                {values.map((value, index) => (
                  <td key={index} className="px-3.5 py-1.5">
                    {truth(value)}
                  </td>
                ))}
                {compoundKeys.map((key) => {
                  const result = connectives[key].apply(values)
                  return (
                    <td
                      key={key}
                      className={`px-3.5 py-1.5 ${key === 'conjunction' ? 'border-l-[1.5px] border-ink' : ''} ${result ? '' : 'text-marker'} ${key === tab ? 'text-2xl' : 'opacity-55'}`}
                    >
                      {truth(result)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('sideBySide.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function enoughCard() {
    const cellClass = 'border-t border-dashed border-faint py-3.5 pr-4.5 align-top text-[15px]'
    return (
      <TitledCard title={t('cards.enough')}>
        <table className="border-collapse text-left">
          <thead>
            <tr>
              <th />
              <th className="py-3.5 pr-4.5 font-hand text-[21px] leading-tight font-bold">{t('enough.toBeTrue')}</th>
              <th className="py-3.5 pr-4.5 font-hand text-[21px] leading-tight font-bold">{t('enough.toBeFalse')}</th>
            </tr>
          </thead>
          <tbody>
            {compoundKeys.map((key) => (
              <tr key={key}>
                <th className="border-t border-dashed border-faint py-3.5 pr-4.5 align-top font-normal">
                  <MathTex tex={key === 'conjunction' ? '\\wedge' : '\\vee'} />
                </th>
                {([true, false] as const).map((value) => (
                  <td
                    key={String(value)}
                    className={`${cellClass} ${key === tab && activeResult === value ? 'bg-highlight-soft' : ''}`}
                  >
                    {t(`enough.${key}.${value ? 'true' : 'false'}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('enough.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function examplesCard() {
    const cellClass = 'py-3.5 pr-4.5 align-top text-[15px]'
    return (
      <TitledCard title={t('cards.examples')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="border-collapse text-left">
            <tbody>
              {examples.map((example, index) => {
                const letter = negationLetters[index]
                const rule = index > 0 ? 'border-t border-dashed border-faint' : ''
                return (
                  <tr key={letter}>
                    <td className={`${cellClass} ${rule}`}>
                      <MathTex tex={letter} />
                    </td>
                    <td className={`${cellClass} ${rule}`}>
                      <MathText text={example.text} />
                    </td>
                    <td className={`${cellClass} ${rule} whitespace-nowrap`}>
                      <MathTex tex={`\\neg ${letter}`} />
                    </td>
                    <td className={`${cellClass} ${rule}`}>
                      <MathText text={example.negation} />
                      {example.remark && (
                        <span className="mt-1.5 block text-muted">
                          <MathText text={example.remark} />
                        </span>
                      )}
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
            inputsTex={connective.inputsTex}
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
          total={connective.rows.length}
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
          {tab === 'negation' ? (
            examplesCard()
          ) : (
            <>
              {sideBySideCard()}
              {enoughCard()}
            </>
          )}
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
              <p className="mb-3.5">{text('intro')}</p>
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
            {tab !== 'negation' && (
              <div className="contents">
                <dt className={`${swatchClass} h-7.5`}>
                  {truth(false)}
                  <span aria-hidden="true" className={deciderRingClass} />
                </dt>
                <dd className="text-muted">{t('legend.decider')}</dd>
              </div>
            )}
            {symbolTex.map((entry) => (
              <div key={entry.key} className="contents">
                <dt className="flex w-8.5 justify-center">
                  <MathTex tex={entry.tex} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">{t(`legend.${entry.key}`)}</dd>
              </div>
            ))}
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
