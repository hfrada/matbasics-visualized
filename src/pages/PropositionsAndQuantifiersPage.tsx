import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { TabButton } from '../components/atoms/TabButton'
import { Title } from '../components/atoms/Title'
import { NoteCard } from '../components/molecules/NoteCard'
import { TitledCard } from '../components/molecules/TitledCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PlayButton } from '../components/molecules/PlayButton'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import {
  PropositionFlowBoard,
  type OutcomeKey,
  type SentenceStatus,
} from '../components/organisms/PropositionFlowBoard'
import { QuantifierCheckBoard, type CheckLayout } from '../components/organisms/QuantifierCheckBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'

type OpenKey = 'plusOne' | 'plusThree' | 'minusThree' | 'equation' | 'primes' | 'composites'
type TabKey = 'proposition' | OpenKey
type QuantifierKey = 'all' | 'exists'
type SentenceKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'
type CheckKind = 'prime' | 'membership' | 'equation'
type GeneralKey = 'plusThree'

type Sentence = {
  letter: SentenceKey
  declarative: boolean
  outcome: OutcomeKey
  symbol?: string
}

type Sample = {
  value: number
  tex: string
  plain: string
}

type OpenSentence = {
  variables: string[]
  kind: CheckKind
  general?: GeneralKey
} & (
  | {
      layout: 'line'
      samples: Sample[]
      moreLeft: boolean
      rowTex: string
      evaluate: (x: number) => number
      equationTex: (xTex: string, value: number) => string
      holds: (value: number) => boolean
    }
  | { layout: 'grid'; members: number[] }
)

type Cell = {
  assignTex: string
  assignPlain: string
  equationTex: string
  valueTex: string
  ok: boolean
}

type Analysis = {
  decide: number
  value: boolean
  needsGeneral: boolean
  steps: number
  decideStep: number
}

const openKeys: OpenKey[] = ['plusOne', 'plusThree', 'minusThree', 'equation', 'primes', 'composites']
const tabKeys: TabKey[] = ['proposition', ...openKeys]
const quantifierKeys: QuantifierKey[] = ['all', 'exists']
const quantifierTex: Record<QuantifierKey, string> = { all: '\\forall', exists: '\\exists' }
const delays = [0.5, 1, 1.5, 2, 3]

const sentences: Sentence[] = [
  { letter: 'a', declarative: true, outcome: 'notDefinite' },
  { letter: 'b', declarative: true, outcome: 'false', symbol: 'Q' },
  { letter: 'c', declarative: true, outcome: 'true', symbol: 'R' },
  { letter: 'd', declarative: false, outcome: 'notDeclarative' },
  { letter: 'e', declarative: false, outcome: 'notDeclarative' },
  { letter: 'f', declarative: true, outcome: 'true', symbol: 'P' },
  { letter: 'g', declarative: true, outcome: 'notDefinite' },
]

function isPrime(value: number) {
  if (value < 2) return false
  for (let divisor = 2; divisor * divisor <= value; divisor++) if (value % divisor === 0) return false
  return true
}

function numberTex(value: number) {
  return value < 0 ? `-${-value}` : `${value}`
}

function parenthesized(tex: string) {
  return tex.startsWith('-') ? `(${tex})` : tex
}

function isNatural(value: number) {
  return value >= 1
}

const naturals: Sample[] = Array.from({ length: 10 }, (_, index) => ({
  value: index + 1,
  tex: `${index + 1}`,
  plain: `${index + 1}`,
}))

const realSamples: Sample[] = [
  { value: -1, tex: '-1', plain: '−1' },
  { value: -0.5, tex: '-\\tfrac12', plain: '−½' },
  { value: 0, tex: '0', plain: '0' },
  { value: 0.5, tex: '\\tfrac12', plain: '½' },
  { value: 1, tex: '1', plain: '1' },
  { value: 2, tex: '2', plain: '2' },
  { value: 3, tex: '3', plain: '3' },
]

function naturalMembership(value: number) {
  return `${numberTex(value)} ${isNatural(value) ? '\\in' : '\\notin'} \\mathbb{N}`
}

const openSentences: Record<OpenKey, OpenSentence> = {
  plusOne: {
    variables: ['x'],
    kind: 'prime',
    layout: 'line',
    samples: naturals,
    moreLeft: false,
    rowTex: 'x + 1',
    evaluate: (x) => x + 1,
    equationTex: (x, value) => `${x} + 1 = ${value}`,
    holds: isPrime,
  },
  plusThree: {
    variables: ['x'],
    kind: 'membership',
    general: 'plusThree',
    layout: 'line',
    samples: naturals,
    moreLeft: false,
    rowTex: 'x + 3',
    evaluate: (x) => x + 3,
    equationTex: (x, value) => `${x} + 3 = ${naturalMembership(value)}`,
    holds: isNatural,
  },
  minusThree: {
    variables: ['x'],
    kind: 'membership',
    layout: 'line',
    samples: naturals,
    moreLeft: false,
    rowTex: 'x - 3',
    evaluate: (x) => x - 3,
    equationTex: (x, value) => `${x} - 3 = ${naturalMembership(value)}`,
    holds: isNatural,
  },
  equation: {
    variables: ['x'],
    kind: 'equation',
    layout: 'line',
    samples: realSamples,
    moreLeft: true,
    rowTex: '2x - 1',
    evaluate: (x) => 2 * x - 1,
    equationTex: (x, value) => `2 \\cdot ${parenthesized(x)} - 1 = ${numberTex(value)}`,
    holds: (value) => value === 0,
  },
  primes: { variables: ['x', 'y'], kind: 'prime', layout: 'grid', members: [2, 3, 5, 7] },
  composites: { variables: ['a', 'b'], kind: 'prime', layout: 'grid', members: [4, 6, 8, 9] },
}

function buildCells(item: OpenSentence): Cell[] {
  if (item.layout === 'line') {
    const [name] = item.variables
    return item.samples.map((sample) => {
      const value = item.evaluate(sample.value)
      return {
        assignTex: `$${name} = ${sample.tex}$`,
        assignPlain: `${name} = ${sample.plain}`,
        equationTex: item.equationTex(sample.tex, value),
        valueTex: numberTex(value),
        ok: item.holds(value),
      }
    })
  }
  const [first, second] = item.variables
  return item.members.flatMap((left) =>
    item.members.map((right) => ({
      assignTex: `$${first} = ${left}$, $${second} = ${right}$`,
      assignPlain: `${first} = ${left}, ${second} = ${right}`,
      equationTex: `${left} + ${right} = ${left + right}`,
      valueTex: `${left + right}`,
      ok: isPrime(left + right),
    })),
  )
}

function analyze(cells: Cell[], quantifier: QuantifierKey): Analysis {
  const decide = cells.findIndex((cell) => (quantifier === 'all' ? !cell.ok : cell.ok))
  const needsGeneral = decide === -1
  return {
    decide,
    value: quantifier === 'all' ? needsGeneral : !needsGeneral,
    needsGeneral,
    steps: needsGeneral ? cells.length + 1 : decide + 1,
    decideStep: needsGeneral ? cells.length : decide,
  }
}

function propositionTex(item: OpenSentence, quantifier: QuantifierKey) {
  const variables = item.variables.join(', ')
  return `${quantifierTex[quantifier]} ${variables},\\ b(${variables})`
}

function layoutOf(item: OpenSentence): CheckLayout {
  if (item.layout === 'line') {
    return {
      kind: 'line',
      variableTex: item.variables[0],
      samplesTex: item.samples.map((sample) => sample.tex),
      rowTex: item.rowTex,
      moreLeft: item.moreLeft,
    }
  }
  const [first, second] = item.variables
  return {
    kind: 'grid',
    cornerTex: `${first} + ${second}`,
    rowsTex: item.members.map((member) => `${first} = ${member}`),
    columnsTex: item.members.map((member) => `${second} = ${member}`),
  }
}

export function PropositionsAndQuantifiersPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.propositionsAndQuantifiers' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const { t: tRoot } = useTranslation()
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('propositionsAndQuantifiers')
  const [tab, setTab] = useState<TabKey>('proposition')
  const [quantifier, setQuantifier] = useState<QuantifierKey>('all')
  const [selection, setSelection] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const openKey = tab === 'proposition' ? null : tab
  const item = openKey === null ? null : openSentences[openKey]
  const cells = item === null ? [] : buildCells(item)
  const analysis = analyze(cells, quantifier)
  const steps = item === null ? sentences.length : analysis.steps
  const player = useStepPlayer({ steps, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const picked = current === null ? selection : null
  const shown = (step: number) => current === null || current >= step
  const truth = (value: boolean) => tRoot(value ? 'truthValues.true' : 'truthValues.false')

  function choose(nextTab: TabKey, nextQuantifier: QuantifierKey) {
    player.stop()
    setSelection(null)
    setTab(nextTab)
    setQuantifier(nextQuantifier)
  }

  function select(index: number) {
    setSelection((value) => (value === index ? null : index))
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelection(null)
    player.start()
  }

  function sentenceStatus(index: number): SentenceStatus {
    if (current === index) return 'now'
    return shown(index) ? 'done' : 'later'
  }

  function badgeOf(outcome: OutcomeKey) {
    if (outcome === 'true' || outcome === 'false') return truth(outcome === 'true')
    return t('notProposition')
  }

  function sentenceCaption(sentence: Sentence) {
    return t(`captions.${sentence.outcome}`, { letter: sentence.letter, symbol: sentence.symbol ?? '' })
  }

  function checkText(open: OpenSentence, cell: Cell) {
    const values = { assign: cell.assignTex, equation: cell.equationTex, value: cell.valueTex }
    if (open.kind === 'membership') return t('checks.membership', values)
    if (open.kind === 'equation') return t(cell.ok ? 'checks.solves' : 'checks.notSolves', values)
    return t(cell.ok ? 'checks.prime' : 'checks.notPrime', values)
  }

  function generalReason(open: OpenSentence) {
    return open.general ? t(`general.${open.general}.reason`) : ''
  }

  function stepCaption(open: OpenSentence, step: number) {
    if (step === cells.length && open.general) {
      return t(`general.${open.general}.step`, { reason: generalReason(open) })
    }
    const text = checkText(open, cells[step])
    if (step !== analysis.decide) return text
    const prop = propositionTex(open, quantifier)
    return `${text} ${t(quantifier === 'all' ? 'decide.counter' : 'decide.example', { prop })}`
  }

  function verdictText(open: OpenSentence) {
    const prop = propositionTex(open, quantifier)
    if (analysis.needsGeneral) return t('verdicts.general', { prop, reason: generalReason(open) })
    const decider = cells[analysis.decide].assignTex
    return t(quantifier === 'all' ? 'verdicts.counter' : 'verdicts.example', { prop, decider })
  }

  function roleText(index: number) {
    const cell = cells[index]
    if (index === analysis.decide) return t(quantifier === 'all' ? 'roles.firstCounter' : 'roles.firstExample')
    if (quantifier === 'all') return t(cell.ok ? 'roles.notEnoughAll' : 'roles.alsoCounter')
    return t(cell.ok ? 'roles.alsoExample' : 'roles.falseButExists')
  }

  const flowLabels = {
    start: t('flow.start'),
    declarative: t('flow.declarative'),
    definite: t('flow.definite'),
    yes: t('flow.yes'),
    no: t('flow.no'),
    trueValue: truth(true),
    falseValue: truth(false),
    outcomes: {
      notDeclarative: { title: t('notProposition'), sub: t('outcomes.notDeclarative') },
      notDefinite: { title: t('notProposition'), sub: t('outcomes.notDefinite') },
      true: { title: t('proposition'), sub: t('outcomes.true') },
      false: { title: t('proposition'), sub: t('outcomes.false') },
    },
    aria: t('flow.aria'),
  }

  const traySentences = sentences.map((sentence, index) => ({
    letter: sentence.letter,
    text: t(`sentences.${sentence.letter}.text`),
    outcome: sentence.outcome,
    badge: badgeOf(sentence.outcome),
    status: sentenceStatus(index),
  }))

  function quantifierBoard(key: OpenKey) {
    const open = openSentences[key]
    const verdictShown = shown(analysis.decideStep)
    const evaluated = (index: number) => current === null || index <= Math.min(current, cells.length - 1)
    const boardCells = cells.map((cell, index) => {
      const ruled = (index === analysis.decide && verdictShown) || current === index
      return {
        label: `${cell.assignPlain}: ${cell.valueTex.replace('-', '−')}`,
        valueTex: cell.valueTex,
        status: evaluated(index) ? (cell.ok ? 'true' : 'false') : 'unchecked',
        ring: ruled ? 'solid' : picked === index ? 'dashed' : 'none',
        truthLabel: evaluated(index) ? truth(cell.ok) : null,
      } as const
    })
    return (
      <TitledCard title={t('board.examples')}>
        <p className="mb-4.5">
          <MathText text={t('claim', { variables: open.variables.join(', '), open: t(`open.${key}`) })} />
        </p>
        <p className="mb-4.5 flex flex-wrap items-baseline gap-x-4.5 gap-y-1.5">
          <MathTex tex={propositionTex(open, quantifier)} className="text-xl" />
          <span
            className={`font-hand text-2xl leading-none font-bold transition-opacity duration-300 ${verdictShown ? '' : 'opacity-25'}`}
          >
            {t('verdict', { value: truth(analysis.value) })}
          </span>
        </p>
        <QuantifierCheckBoard
          layout={layoutOf(open)}
          cells={boardCells}
          picked={picked}
          interactive={!player.playing}
          onPick={select}
        />
        {analysis.needsGeneral && (
          <p className={`mt-3 text-[15px] transition-opacity duration-300 ${verdictShown ? '' : 'opacity-25'}`}>
            <MathText text={t('generalLine', { reason: generalReason(open) })} />
          </p>
        )}
      </TitledCard>
    )
  }

  function propositionCards() {
    const headers = ['sentence', 'declarative', 'definite', 'result', 'symbol'] as const
    return (
      <>
        <TitledCard title={t('cards.results')} wide>
          <div className="relative overflow-x-auto overflow-y-hidden">
            <table className="border-collapse">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="pt-0.5 pr-5.5 pb-2 text-left font-hand text-[21px] leading-tight font-bold whitespace-nowrap"
                    >
                      {t(`table.${header}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sentences.map((sentence, index) => {
                  const status = sentenceStatus(index)
                  const proposition = sentence.outcome === 'true' || sentence.outcome === 'false'
                  const tone = status === 'later' ? 'opacity-25' : status === 'now' ? 'bg-highlight-soft' : ''
                  const cellClass = `border-t border-dashed border-faint py-2.25 pr-5.5 text-[15px] transition-opacity duration-300 ${tone}`
                  return (
                    <tr key={sentence.letter}>
                      <td className={cellClass}>({sentence.letter})</td>
                      <td className={cellClass}>
                        {sentence.declarative ? t('table.yes') : <span className="text-faint">{t('table.no')}</span>}
                      </td>
                      <td className={cellClass}>
                        {!sentence.declarative ? (
                          <span className="text-faint">–</span>
                        ) : proposition ? (
                          t('table.yes')
                        ) : (
                          <span className="text-faint">{t('table.no')}</span>
                        )}
                      </td>
                      <td className={cellClass}>
                        {proposition ? (
                          t('table.proposition', { value: badgeOf(sentence.outcome) })
                        ) : (
                          <span className="text-faint">{t('notProposition')}</span>
                        )}
                      </td>
                      <td className={cellClass}>{sentence.symbol && <MathTex tex={sentence.symbol} />}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TitledCard>
        <TitledCard title={t('cards.definition')}>
          <p>
            <strong>{t('definition.term')}</strong> {t('definition.rest')}
          </p>
        </TitledCard>
        <TitledCard title={t('cards.symbols')}>
          <p className="mb-3">
            <MathText text={t('symbolsText.names')} />
          </p>
          <p>{t('symbolsText.values')}</p>
        </TitledCard>
      </>
    )
  }

  function quantifierCards(open: OpenSentence) {
    const enoughRows = [
      { quantifier: 'all', true: 'enough.allTrue', false: 'enough.allFalse' },
      { quantifier: 'exists', true: 'enough.existsTrue', false: 'enough.existsFalse' },
    ] as const
    const lit = (rowQuantifier: QuantifierKey, value: boolean) =>
      rowQuantifier === quantifier && analysis.value === value && shown(analysis.decideStep)
    return (
      <>
        <TitledCard title={t('cards.pair')}>
          <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-x-4.5 gap-y-3.5">
            {quantifierKeys.map((key) => {
              const info = analyze(cells, key)
              const active = key === quantifier
              const decided = !active || shown(info.decideStep)
              const decider = info.needsGeneral ? '' : cells[info.decide].assignTex
              const why = info.needsGeneral
                ? t('pair.general')
                : t(key === 'all' ? 'pair.counter' : 'pair.example', { decider })
              const fade = `transition-opacity duration-300 ${decided ? '' : 'opacity-25'}`
              return (
                <div key={key} className="contents">
                  <span className={active ? '-mx-1 rounded-[4px] bg-highlight-soft px-1' : ''}>
                    <MathTex tex={propositionTex(open, key)} />
                  </span>
                  <span className={`font-hand text-[22px] leading-none font-bold ${fade}`}>{truth(info.value)}</span>
                  <span className={`text-[15px] text-muted ${fade}`}>
                    <MathText text={why} />
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-4.5 text-[15px] text-muted">
            <MathText text={t('pair.footnote', { variables: open.variables.join(', ') })} />
          </p>
        </TitledCard>
        <TitledCard title={t('cards.reading')}>
          <p className="mb-3">
            <MathText text={t('reading.all')} />
          </p>
          <p>
            <MathText text={t('reading.exists')} />
          </p>
        </TitledCard>
        <TitledCard title={t('cards.enough')} wide>
          <div className="relative overflow-x-auto overflow-y-hidden">
            <table className="border-collapse text-left">
              <thead>
                <tr>
                  <th />
                  <th className="py-3.5 pr-4.5 font-hand text-[21px] leading-tight font-bold">{t('enough.toBeTrue')}</th>
                  <th className="py-3.5 pr-4.5 font-hand text-[21px] leading-tight font-bold">{t('enough.toBeFalse')}</th>
                </tr>
              </thead>
              <tbody>
                {enoughRows.map((row) => (
                  <tr key={row.quantifier}>
                    <th className="border-t border-dashed border-faint py-3.5 pr-4.5 align-top font-normal">
                      <MathTex tex={quantifierTex[row.quantifier]} />
                    </th>
                    {([true, false] as const).map((value) => (
                      <td
                        key={String(value)}
                        className={`border-t border-dashed border-faint py-3.5 pr-4.5 align-top text-[15px] ${lit(row.quantifier, value) ? 'bg-highlight-soft' : ''}`}
                      >
                        <MathText text={t(value ? row.true : row.false)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TitledCard>
      </>
    )
  }

  function noteContent() {
    if (item === null) {
      if (picked !== null) {
        const sentence = sentences[picked]
        return (
          <p>
            <strong>({sentence.letter})</strong> <MathText text={t(`sentences.${sentence.letter}.reason`)} />
          </p>
        )
      }
      return (
        <>
          <p className="mb-3.5">{t('intro.proposition')}</p>
          <p className="text-muted">{t('hint.proposition')}</p>
        </>
      )
    }
    if (picked !== null) {
      return (
        <>
          <p className="mb-3.5">
            <MathText text={checkText(item, cells[picked])} />
          </p>
          <p>
            <MathText text={roleText(picked)} />
          </p>
        </>
      )
    }
    return (
      <>
        <p className="mb-3.5">{t('intro.open')}</p>
        <p className="mb-3.5">
          <MathText text={verdictText(item)} />
        </p>
        <p className="text-muted">{t('hint.quantifier')}</p>
      </>
    )
  }

  const swatchClass = 'flex h-6 w-8.5 items-center justify-center font-hand text-xl font-bold'
  const truthSwatches = (
    <>
      <div className="contents">
        <dt className={`${swatchClass} ${item === null ? '' : 'bg-highlight dark:text-paper'}`}>{truth(true)}</dt>
        <dd className="text-muted">{t('legend.true')}</dd>
      </div>
      <div className="contents">
        <dt className={`${swatchClass} ${item === null ? '' : 'text-marker'}`}>{truth(false)}</dt>
        <dd className="text-muted">{t('legend.false')}</dd>
      </div>
    </>
  )

  const legendTex =
    item === null
      ? ([{ key: 'names', tex: 'P, Q, R' }] as const)
      : ([
          { key: 'all', tex: '\\forall' },
          { key: 'exists', tex: '\\exists' },
          { key: 'primes', tex: '\\mathbb{P}' },
          { key: 'composites', tex: '\\mathbb{K}' },
        ] as const)

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup
            options={tabKeys.map((key) => ({ value: key, label: t(`tabs.${key}`) }))}
            value={tab}
            onChange={(key) => choose(key, quantifier)}
          />
          <div
            inert={item === null}
            className={`flex flex-wrap items-baseline gap-x-5 gap-y-3 transition-opacity duration-300 ${item === null ? 'opacity-30' : ''}`}
          >
            <span className="font-hand text-xl text-muted">{t('controls.quantifier')}</span>
            {quantifierKeys.map((key) => (
              <TabButton key={key} active={item !== null && key === quantifier} onClick={() => choose(tab, key)}>
                {t(`quantifiers.${key}`)}
              </TabButton>
            ))}
          </div>
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
        openKey === null ? (
          <TitledCard title={t('board.sentences')}>
            <PropositionFlowBoard
              sentences={traySentences}
              active={current ?? selection}
              picked={picked}
              interactive={!player.playing}
              labels={flowLabels}
              onPick={select}
            />
          </TitledCard>
        ) : (
          quantifierBoard(openKey)
        )
      }
      progress={
        <StepProgress
          total={steps}
          current={current}
          caption={
            current !== null && (
              <MathText text={item === null ? sentenceCaption(sentences[current]) : stepCaption(item, current)} />
            )
          }
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-6 sm:grid-cols-2">{item === null ? propositionCards() : quantifierCards(item)}</div>
      }
      detail={
        <NoteCard>
          {noteContent()}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 border-t border-dashed border-faint pt-3">
            {truthSwatches}
            {legendTex.map((entry) => (
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
