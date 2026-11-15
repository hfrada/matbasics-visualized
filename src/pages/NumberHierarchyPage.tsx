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
import {
  guideLineClass,
  holeClass,
  NumberLinesBoard,
  realLineClass,
  tinyDotClass,
  type LineKind,
  type LinePoint,
  type LineRow,
} from '../components/organisms/NumberLinesBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'

type TabKey = 'build' | 'disguised'
type LevelKey = 'natural' | 'whole' | 'integer' | 'rational' | 'real' | 'complex'
type PartKey = 'prime' | 'one' | 'composite'
type DecimalKey = 'threeQuarters' | 'repeating'
type ReasonKey =
  | 'one'
  | 'two'
  | 'three'
  | 'zero'
  | 'negative'
  | 'fraction'
  | 'sqrtTwo'
  | 'pi'
  | 'imaginaryUnit'
  | 'onePlusTwoI'
  | 'sixThirds'
  | 'sqrtNine'
  | 'minusEightQuarters'
  | 'iSquared'
  | 'threeQuarters'
  | 'repeating'
  | 'sqrtEight'
  | 'sqrtMinusFour'

type Level = {
  key: LevelKey
  symbol: string
  tex: string
  rule: string
  kind: LineKind
}

type NumberEntry = {
  tex: string
  plain: string
  decimal?: DecimalKey
  valueTex?: string
  x: number
  y?: number
  level: number
  part?: PartKey
  below?: boolean
  reason: ReasonKey
}

type Selection = { kind: 'number'; index: number } | { kind: 'level'; index: number }

const tabKeys: TabKey[] = ['build', 'disguised']
const delays = [0.5, 1, 1.5, 2, 3]

const levels: Level[] = [
  {
    key: 'natural',
    symbol: 'ℕ',
    tex: '\\mathbb{N}',
    rule: '\\mathbb{N}=\\mathbb{P}\\cup\\{1\\}\\cup\\mathbb{K}',
    kind: 'guide',
  },
  { key: 'whole', symbol: 'ℂₐ', tex: '\\mathbb{C}_a', rule: '\\mathbb{C}_a=\\{0\\}\\cup\\mathbb{N}', kind: 'guide' },
  { key: 'integer', symbol: 'ℤ', tex: '\\mathbb{Z}', rule: '\\mathbb{Z}=\\mathbb{C}_a\\cup\\mathbb{N}_n', kind: 'guide' },
  {
    key: 'rational',
    symbol: 'ℚ',
    tex: '\\mathbb{Q}',
    rule: '\\mathbb{Q}=\\{\\tfrac{m}{n}\\mid m,n\\in\\mathbb{Z},\\ n\\neq 0\\}',
    kind: 'dense',
  },
  { key: 'real', symbol: 'ℝ', tex: '\\mathbb{R}', rule: '\\mathbb{R}=\\mathbb{Q}\\cup\\mathbb{I}_r', kind: 'solid' },
  {
    key: 'complex',
    symbol: 'ℂ',
    tex: '\\mathbb{C}',
    rule: '\\mathbb{C}=\\{a+bi\\mid a,b\\in\\mathbb{R},\\ i^2=-1\\}',
    kind: 'plane',
  },
]

const partTex: Record<PartKey, string> = {
  prime: '\\mathbb{P}',
  one: '\\{1\\}',
  composite: '\\mathbb{K}',
}

const numbersByTab: Record<TabKey, NumberEntry[]> = {
  build: [
    { tex: '1', plain: '1', x: 1, level: 0, part: 'one', reason: 'one' },
    { tex: '2', plain: '2', x: 2, level: 0, part: 'prime', reason: 'two' },
    { tex: '3', plain: '3', x: 3, level: 0, part: 'prime', reason: 'three' },
    { tex: '0', plain: '0', x: 0, level: 1, reason: 'zero' },
    { tex: '-1', plain: '−1', x: -1, level: 2, reason: 'negative' },
    { tex: '-2', plain: '−2', x: -2, level: 2, reason: 'negative' },
    { tex: '-3', plain: '−3', x: -3, level: 2, reason: 'negative' },
    { tex: '\\tfrac12', plain: '1/2', x: 1 / 2, level: 3, reason: 'fraction' },
    { tex: '-\\tfrac23', plain: '−2/3', x: -2 / 3, level: 3, reason: 'fraction' },
    { tex: '\\sqrt2', plain: '√2', x: Math.SQRT2, level: 4, reason: 'sqrtTwo' },
    { tex: '\\pi', plain: 'π', x: Math.PI, level: 4, reason: 'pi' },
    { tex: 'i', plain: 'i', x: 0, y: 1, level: 5, reason: 'imaginaryUnit' },
    { tex: '1+2i', plain: '1 + 2i', x: 1, y: 2, level: 5, reason: 'onePlusTwoI' },
  ],
  disguised: [
    { tex: '\\tfrac63', plain: '6/3', valueTex: '2', x: 2, level: 0, part: 'prime', reason: 'sixThirds' },
    { tex: '\\sqrt9', plain: '√9', valueTex: '3', x: 3, level: 0, part: 'prime', below: true, reason: 'sqrtNine' },
    { tex: '-\\tfrac84', plain: '−8/4', valueTex: '-2', x: -2, level: 2, reason: 'minusEightQuarters' },
    { tex: 'i^2', plain: 'i²', valueTex: '-1', x: -1, level: 2, below: true, reason: 'iSquared' },
    { tex: '', plain: '', decimal: 'threeQuarters', valueTex: '\\tfrac34', x: 3 / 4, level: 3, reason: 'threeQuarters' },
    {
      tex: '',
      plain: '',
      decimal: 'repeating',
      valueTex: '\\tfrac13',
      x: 1 / 3,
      level: 3,
      below: true,
      reason: 'repeating',
    },
    { tex: '\\sqrt8', plain: '√8', valueTex: '2\\sqrt2', x: 2 * Math.SQRT2, level: 4, reason: 'sqrtEight' },
    { tex: '\\sqrt{-4}', plain: '√−4', valueTex: '2i', x: 0, y: 2, level: 5, reason: 'sqrtMinusFour' },
  ],
}

const chainTex = levels.map((level) => level.tex).join('\\subset ')

export function NumberHierarchyPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.numberHierarchy' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('numberHierarchy')
  const [tab, setTab] = useState<TabKey>('build')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [delay, setDelay] = useState(1)

  const numbers = numbersByTab[tab]
  const building = tab === 'build'
  const steps = building ? levels.length : numbers.length
  const player = useStepPlayer({ steps, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const playing = current !== null
  const selectedNumber = !playing && selection?.kind === 'number' ? numbers[selection.index] : null
  const selectedLevel = !playing && selection?.kind === 'level' ? selection.index : null

  const formTex = (entry: NumberEntry) => (entry.decimal ? t(`decimals.${entry.decimal}.tex`) : entry.tex)
  const formPlain = (entry: NumberEntry) => (entry.decimal ? t(`decimals.${entry.decimal}.plain`) : entry.plain)
  const valueTex = (entry: NumberEntry) => entry.valueTex ?? formTex(entry)
  const fullTex = (entry: NumberEntry) => (entry.valueTex ? `${formTex(entry)}=${entry.valueTex}` : formTex(entry))

  const levelShown = (index: number) => !building || current === null || index <= current
  const levelNow = (index: number) =>
    current !== null && (building ? index === current : numbers[current].level === index)
  const numberShown = (index: number) =>
    current === null || (building ? numbers[index].level <= current : index <= current)
  const numberGlows = (index: number) =>
    current !== null && (building ? numbers[index].level === current : index === current)
  const levelMarked = (index: number) =>
    levelNow(index) || selectedLevel === index || (selectedNumber !== null && index >= selectedNumber.level)

  function pointOf(entry: NumberEntry, index: number, rowIndex: number): LinePoint {
    const home = entry.level === rowIndex
    const picked = selectedNumber === entry
    let status: LinePoint['status'] = 'plain'
    if (!numberShown(index)) status = 'hidden'
    else if (picked) status = home ? 'selected' : 'lit'
    else if (home && numberGlows(index)) status = 'glow'
    return {
      id: index,
      x: entry.x,
      y: entry.y ?? 0,
      labelTex: home ? fullTex(entry) : null,
      placement: entry.below ? 'below' : 'above',
      ariaLabel: `${formPlain(entry)} ∈ ${levels[rowIndex].symbol}`,
      status,
    }
  }

  const rows: LineRow[] = levels
    .map((level, index): LineRow => {
      let visibility: LineRow['visibility'] = 'shown'
      if (!levelShown(index)) visibility = 'hidden'
      else if (selectedNumber !== null && index < selectedNumber.level) visibility = 'faded'
      const highlightX =
        selectedNumber !== null && selectedNumber.y === undefined && index >= selectedNumber.level
          ? selectedNumber.x
          : null
      const name = t(`sets.${level.key}`)
      return {
        id: index,
        labelTex: level.tex,
        name,
        ariaLabel: `${level.symbol} ${name}`,
        kind: level.kind,
        marked: levelMarked(index),
        visibility,
        highlightX,
        holes: level.kind === 'dense' ? numbers.filter((entry) => entry.level === 4).map((entry) => entry.x) : [],
        points: numbers.flatMap((entry, numberIndex) =>
          entry.level <= index ? [pointOf(entry, numberIndex, index)] : [],
        ),
      }
    })
    .reverse()

  function stepCaption(step: number) {
    if (building) return t(`build.${levels[step].key}`)
    const entry = numbers[step]
    return t('step', { expression: fullTex(entry), set: levels[entry.level].tex })
  }

  function noteLines() {
    if (selectedNumber !== null) {
      const value = valueTex(selectedNumber)
      const home = selectedNumber.level
      const chain = levels
        .slice(home)
        .map((level) => level.tex)
        .join('\\subset ')
      let below = t('note.notBelow', { value, set: levels[home - 1]?.tex })
      if (home === 0) below = t('note.inNatural', { value, part: partTex[selectedNumber.part ?? 'prime'] })
      if (home === 1) below = t('note.notNatural', { value })
      return [t(`reasons.${selectedNumber.reason}`), t('note.lowest', { set: levels[home].tex, value, chain }), below]
    }
    if (selectedLevel !== null) return [t(`about.${levels[selectedLevel].key}`)]
    return [t(`intro.${tab}`), `$${chainTex}$`]
  }

  function chooseTab(next: TabKey) {
    player.stop()
    setSelection(null)
    setTab(next)
  }

  function toggle(next: Selection) {
    setSelection((value) => (value?.kind === next.kind && value.index === next.index ? null : next))
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelection(null)
    player.start()
  }

  const legendTex = [
    { key: 'prime', tex: '\\mathbb{P}' },
    { key: 'composite', tex: '\\mathbb{K}' },
    { key: 'negatives', tex: '\\mathbb{N}_n' },
    { key: 'irrationals', tex: '\\mathbb{I}_r' },
    { key: 'imaginaryUnit', tex: 'i' },
    { key: 'subset', tex: '\\subset' },
    { key: 'member', tex: '\\in' },
    { key: 'notMember', tex: '\\notin' },
  ] as const

  const legendLines = [
    { key: 'guide', marks: <span className={`inset-x-0 ${guideLineClass}`} style={{ top: '50%' }} /> },
    { key: 'realLine', marks: <span className={`inset-x-0 ${realLineClass}`} style={{ top: '50%' }} /> },
    {
      key: 'otherFractions',
      marks: [30, 50, 70].map((left) => (
        <span key={left} className={tinyDotClass} style={{ left: `${left}%`, top: '50%' }} />
      )),
    },
    { key: 'gap', marks: <span className={holeClass} style={{ left: '50%', top: '50%' }} /> },
  ] as const

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
            onChange={chooseTab}
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
        <div className="pen-border relative bg-paper px-4 pt-3.5 pb-4">
          <p className="mb-2.5 flex flex-wrap justify-center gap-x-1.5 font-hand text-2xl">
            {levels.map((level, index) => (
              <span
                key={level.key}
                className={`flex gap-x-1.5 transition-opacity duration-300 ${levelShown(index) ? '' : 'opacity-20'}`}
              >
                {index > 0 && <MathTex tex="\subset" className="text-[0.85em]" />}
                <MathTex tex={level.tex} className="text-[0.85em]" />
              </span>
            ))}
          </p>
          {!building && (
            <div className="mb-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded border-[1.5px] border-dashed border-faint px-2.5 py-1.5">
              <span className="mr-1 font-hand text-[21px] text-muted">{t('tray')}</span>
              {numbers.map((entry, index) => (
                <button
                  key={entry.reason}
                  type="button"
                  aria-label={formPlain(entry)}
                  disabled={player.playing}
                  onClick={() => toggle({ kind: 'number', index })}
                  className={`relative rounded-[3px] px-1.5 py-0.5 text-[17px] ${player.playing ? '' : 'cursor-pointer'} ${numberGlows(index) ? 'bg-highlight dark:text-paper' : 'hover:bg-highlight-soft'}`}
                >
                  <MathTex tex={formTex(entry)} />
                  {selectedNumber === entry && (
                    <span className="pointer-events-none absolute -inset-x-1.5 -inset-y-1 rounded-[50%] border-2 border-marker" />
                  )}
                </button>
              ))}
            </div>
          )}
          <NumberLinesBoard
            rows={rows}
            interactive={!player.playing}
            onSelectPoint={(index) => toggle({ kind: 'number', index })}
            onSelectRow={(index) => toggle({ kind: 'level', index })}
          />
        </div>
      }
      progress={
        <StepProgress
          total={steps}
          current={current}
          caption={current !== null && <MathText text={stepCaption(current)} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-5">
          <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('cards.build')}</h2>
            {levels.map((level, index) => (
              <div
                key={level.key}
                className={`flex flex-wrap items-baseline gap-x-3 py-0.5 transition-opacity duration-300 ${building && !levelShown(index) ? 'opacity-25' : ''}`}
              >
                <button
                  type="button"
                  disabled={player.playing}
                  onClick={() => toggle({ kind: 'level', index })}
                  className={`rounded-[3px] px-1 text-[17px] ${player.playing ? '' : 'cursor-pointer'} ${levelMarked(index) ? 'marker-highlight dark:text-paper' : 'hover:bg-highlight-soft'}`}
                >
                  <MathTex tex={level.rule} />
                </button>
                <span className="font-hand text-xl text-muted">
                  <MathText text={t(`added.${level.key}`)} />
                </span>
              </div>
            ))}
          </div>
          <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('cards.membership')}</h2>
            <div className="relative overflow-x-auto">
              <table className="my-1 border-collapse text-base">
                <thead>
                  <tr>
                    <th className="border-r-[1.5px] border-b-[1.5px] border-ink" />
                    {numbers.map((entry, index) => (
                      <th
                        key={entry.reason + index}
                        className={`border-b-[1.5px] border-ink px-2 py-0.5 font-normal whitespace-nowrap transition-opacity duration-300 ${numberShown(index) ? '' : 'opacity-20'} ${numberGlows(index) || selectedNumber === entry ? 'bg-highlight-soft' : ''}`}
                      >
                        <MathTex tex={formTex(entry)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {levels.map((level, rowIndex) => (
                    <tr key={level.key}>
                      <th
                        className={`border-r-[1.5px] border-ink px-2 py-0.5 font-normal transition-opacity duration-300 ${levelShown(rowIndex) ? '' : 'opacity-20'}`}
                      >
                        <MathTex tex={level.tex} />
                      </th>
                      {numbers.map((entry, index) => {
                        const member = entry.level <= rowIndex
                        const faint = !numberShown(index) || !levelShown(rowIndex)
                        return (
                          <td
                            key={entry.reason + index}
                            data-member={member}
                            className={`px-2 py-0.5 text-center transition-opacity duration-300 ${member ? '' : 'text-faint'} ${faint ? 'opacity-20' : ''} ${numberGlows(index) || selectedNumber === entry ? 'bg-highlight-soft' : ''}`}
                          >
                            <MathTex
                              tex={member ? '\\in' : '\\notin'}
                              className={member ? 'marker-highlight px-[3px] dark:text-paper' : ''}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-hand text-xl leading-snug text-muted">
              <MathText text={t('membershipFootnote')} />
            </p>
          </div>
        </div>
      }
      detail={
        <NoteCard>
          {noteLines().map((line) => (
            <p key={line}>
              <MathText text={line} />
            </p>
          ))}
          {selection === null && <p className="mt-2 text-xl text-muted">{t(`hints.${tab}`)}</p>}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 border-t border-dashed border-faint pt-3">
            {legendTex.map((entry) => (
              <div key={entry.key} className="contents">
                <dt>
                  <MathTex tex={entry.tex} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">
                  <MathText text={t(`symbols.${entry.key}`)} />
                </dd>
              </div>
            ))}
            {legendLines.map((entry) => (
              <div key={entry.key} className="contents">
                <dt className="relative h-4.5 w-8.5">{entry.marks}</dt>
                <dd className="text-muted">
                  <MathText text={t(`symbols.${entry.key}`)} />
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
