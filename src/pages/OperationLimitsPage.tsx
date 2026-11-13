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
  hatchClass,
  OperationTableBoard,
  outsideRingClass,
  type TableCell,
  type TablePosition,
} from '../components/organisms/OperationTableBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  add,
  divide,
  fraction,
  fractionTex,
  multiply,
  operandPlain,
  operandTex,
  subtract,
  type Fraction,
} from '../lib/fraction'

type SetKey = 'natural' | 'whole' | 'integer' | 'rational'
type OperationKey = 'sum' | 'difference' | 'product' | 'quotient'

type NumberSet = {
  symbol: string
  tex: string
  definition: string
  members: Fraction[]
}

type Operation = {
  symbol: string
  tex: string
  apply: (left: Fraction, right: Fraction) => Fraction | null
}

type Entry = {
  position: TablePosition
  left: Fraction
  right: Fraction
  result: Fraction | null
}

const setKeys: SetKey[] = ['natural', 'whole', 'integer', 'rational']
const operationKeys: OperationKey[] = ['sum', 'difference', 'product', 'quotient']
const delays = [0.5, 1, 1.5, 2, 3]

const numberSets: Record<SetKey, NumberSet> = {
  natural: {
    symbol: 'ℕ',
    tex: '\\mathbb{N}',
    definition: '\\mathbb{N}=\\{1,2,3,\\dots\\}',
    members: [1, 2, 3, 4, 5].map((value) => fraction(value)),
  },
  whole: {
    symbol: 'ℂₐ',
    tex: '\\mathbb{C}_a',
    definition: '\\mathbb{C}_a=\\{0\\}\\cup\\mathbb{N}',
    members: [0, 1, 2, 3, 4].map((value) => fraction(value)),
  },
  integer: {
    symbol: 'ℤ',
    tex: '\\mathbb{Z}',
    definition: '\\mathbb{Z}=\\mathbb{C}_a\\cup\\mathbb{N}_n',
    members: [-2, -1, 0, 1, 2].map((value) => fraction(value)),
  },
  rational: {
    symbol: 'ℚ',
    tex: '\\mathbb{Q}',
    definition: '\\mathbb{Q}=\\{\\tfrac{m}{n}\\mid m,n\\in\\mathbb{Z},\\ n\\neq 0\\}',
    members: [fraction(-1), fraction(-1, 2), fraction(0), fraction(1, 3), fraction(2)],
  },
}

const operations: Record<OperationKey, Operation> = {
  sum: { symbol: '+', tex: '+', apply: add },
  difference: { symbol: '−', tex: '-', apply: subtract },
  product: { symbol: '×', tex: '\\times', apply: multiply },
  quotient: { symbol: '÷', tex: '\\div', apply: divide },
}

const chainTex = '\\mathbb{N}\\subset\\mathbb{C}_a\\subset\\mathbb{Z}\\subset\\mathbb{Q}'
function outsideReason(value: Fraction) {
  if (value.denominator !== 1) return 'fraction'
  return value.numerator === 0 ? 'zero' : 'negative'
}

function smallestSetIndex(value: Fraction) {
  if (value.denominator !== 1) return 3
  if (value.numerator >= 1) return 0
  return value.numerator === 0 ? 1 : 2
}

function isInside(value: Fraction, setKey: SetKey) {
  return smallestSetIndex(value) <= setKeys.indexOf(setKey)
}

function buildEntries(setKey: SetKey, operationKey: OperationKey): Entry[] {
  const { members } = numberSets[setKey]
  return members.flatMap((left, row) =>
    members.map((right, column) => ({
      position: { row, column },
      left,
      right,
      result: operations[operationKey].apply(left, right),
    })),
  )
}

function isClosed(setKey: SetKey, operationKey: OperationKey) {
  return buildEntries(setKey, operationKey).every((entry) => entry.result === null || isInside(entry.result, setKey))
}

export function OperationLimitsPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.operationLimits' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('operationLimits')
  const [setKey, setSetKey] = useState<SetKey>('natural')
  const [operationKey, setOperationKey] = useState<OperationKey>('difference')
  const [selection, setSelection] = useState<TablePosition | null>(null)
  const [delay, setDelay] = useState(1)

  const numberSet = numberSets[setKey]
  const operation = operations[operationKey]
  const entries = buildEntries(setKey, operationKey)
  const checked = entries.filter((entry) => entry.result !== null)
  const skipped = entries.length - checked.length
  const player = useStepPlayer({ steps: checked.length, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const visible = current === null ? checked : checked.slice(0, current + 1)
  const isOutside = (entry: Entry) => entry.result !== null && !isInside(entry.result, setKey)
  const outsideCount = checked.filter(isOutside).length
  const firstOutside = checked.find(isOutside)
  const revealed = current === null || (firstOutside !== undefined && checked.indexOf(firstOutside) <= current)
  const visibleOutside = visible.filter(isOutside).length
  const active = current === null ? selection : checked[current].position
  const setTex = numberSet.tex
  const variablesTex = `a${operation.tex} b`

  function expressionTex(entry: Entry) {
    const result = entry.result === null ? '' : `=${fractionTex(entry.result)}`
    return `${operandTex(entry.left)}${operation.tex} ${operandTex(entry.right)}${result}`
  }

  function membershipTex(result: Fraction) {
    return `${fractionTex(result)}${isInside(result, setKey) ? '\\in' : '\\notin'} ${setTex}`
  }

  function cellOf(entry: Entry): TableCell {
    const label = `${operandPlain(entry.left)} ${operation.symbol} ${operandPlain(entry.right)}`
    if (entry.result === null) return { label, resultTex: null, status: 'undefined' }
    if (!visible.includes(entry)) return { label, resultTex: null, status: 'hidden' }
    return { label, resultTex: fractionTex(entry.result), status: isInside(entry.result, setKey) ? 'inside' : 'outside' }
  }

  const size = numberSet.members.length
  const cells = Array.from({ length: size }, (_, row) => entries.slice(row * size, (row + 1) * size).map(cellOf))

  function stepReason(entry: Entry) {
    if (entry.result === null) return ''
    const values = { expression: expressionTex(entry), membership: membershipTex(entry.result) }
    return t(isInside(entry.result, setKey) ? 'reasons.inside' : 'reasons.outside', values)
  }

  function noteText() {
    if (selection === null) return t('reasons.final', { expression: variablesTex, set: setTex })
    const entry = entries[selection.row * size + selection.column]
    if (entry.result === null) return t('reasons.undefined', { dividend: operandTex(entry.left) })
    if (isInside(entry.result, setKey)) return stepReason(entry)
    const why = t(`reasons.${outsideReason(entry.result)}`)
    return t('reasons.outsideWhy', { expression: expressionTex(entry), set: setTex, why })
  }

  function verdictText() {
    if (firstOutside) return t('closed.noExample', { example: expressionTex(firstOutside), set: setTex })
    const words = { plural: t(`sets.${setKey}.plural`), singular: t(`sets.${setKey}.singular`) }
    return t('closed.yesReason', { reason: t(`closed.reasons.${operationKey}`, words) })
  }

  function countText() {
    if (current !== null) return t('closed.soFar', { outside: visibleOutside, checked: visible.length, set: setTex })
    if (outsideCount === 0) return t('closed.allInside', { total: checked.length, set: setTex })
    return t('closed.outsideCount', { outside: outsideCount, total: checked.length, set: setTex })
  }

  function choose(nextSet: SetKey, nextOperation: OperationKey) {
    player.stop()
    setSelection(null)
    setSetKey(nextSet)
    setOperationKey(nextOperation)
  }

  function select(position: TablePosition) {
    setSelection((value) => (value?.row === position.row && value.column === position.column ? null : position))
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelection(null)
    player.start()
  }

  const ruleKey = operationKey === 'quotient' ? 'closed.ruleNonzero' : 'closed.rule'
  const operationWord = t(`operations.${operationKey}`)
  const legendTex = [
    { key: 'notMember', tex: '\\notin' },
    { key: 'negatives', tex: '\\mathbb{N}_n' },
  ] as const

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-hand text-xl text-muted">{t('controls.set')}</span>
            <TabGroup
              options={setKeys.map((key) => ({
                value: key,
                label: `${numberSets[key].symbol} ${t(`sets.${key}.label`)}`,
              }))}
              value={setKey}
              onChange={(key) => choose(key, operationKey)}
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-hand text-xl text-muted">{t('controls.operation')}</span>
            <TabGroup
              options={operationKeys.map((key) => ({ value: key, label: operations[key].symbol }))}
              value={operationKey}
              onChange={(key) => choose(setKey, key)}
            />
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
        <div className="pen-border relative bg-paper px-4 pt-3.5 pb-4.5">
          <p className="mb-2 text-center font-hand text-2xl">
            <MathText text={t('board', { expression: variablesTex, set: setTex })} />
          </p>
          <OperationTableBoard
            cornerTex={variablesTex}
            headerTex={numberSet.members.map(fractionTex)}
            cells={cells}
            active={active}
            interactive={!player.playing}
            onSelect={select}
          />
        </div>
      }
      progress={
        <StepProgress
          total={checked.length}
          current={current}
          caption={current !== null && <MathText text={stepReason(checked[current])} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-5">
          <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('cards.closed')}</h2>
            <p className="font-hand text-xl leading-snug">
              <MathText text={t(ruleKey, { set: setTex, operation: operationWord, expression: variablesTex })} />
            </p>
            <p
              className={`font-hand text-xl leading-snug transition-opacity duration-300 ${revealed ? '' : 'opacity-15'}`}
            >
              <strong className={firstOutside ? 'text-marker' : ''}>
                {t(firstOutside ? 'closed.no' : 'closed.yes')}
              </strong>{' '}
              <MathText text={verdictText()} />
            </p>
            <p className="font-hand text-xl leading-snug text-muted">
              <MathText text={countText()} />
            </p>
            {skipped > 0 && current === null && (
              <p className="font-hand text-xl leading-snug text-muted">
                <MathText text={t('closed.skipped', { count: skipped })} />
              </p>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.summary')}</h2>
              <table className="border-collapse text-[17px]">
                <thead>
                  <tr>
                    <th />
                    {operationKeys.map((key) => (
                      <th key={key} className="px-1.5 py-0.5 font-medium">
                        <MathTex tex={operations[key].tex} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {setKeys.map((rowSet) => (
                    <tr key={rowSet}>
                      <th className="px-1.5 font-medium">
                        <MathTex tex={numberSets[rowSet].tex} />
                      </th>
                      {operationKeys.map((rowOperation) => {
                        const closed = isClosed(rowSet, rowOperation)
                        const chosen = rowSet === setKey && rowOperation === operationKey
                        const answer = t(closed ? 'summary.yes' : 'summary.no')
                        return (
                          <td key={rowOperation} className="px-0.5 text-center">
                            <button
                              type="button"
                              aria-pressed={chosen}
                              aria-label={`${numberSets[rowSet].symbol} ${operations[rowOperation].symbol}: ${answer}`}
                              onClick={() => choose(rowSet, rowOperation)}
                              className={`cursor-pointer px-2 font-hand text-[22px] ${closed ? '' : 'text-marker'} ${chosen ? 'marker-highlight' : 'hover:bg-highlight-soft'} ${chosen && closed ? 'dark:text-paper' : ''}`}
                            >
                              {answer}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1 font-hand text-xl leading-snug text-muted">
                <MathText text={t('summary.footnote')} />
              </p>
            </div>
            <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.larger')}</h2>
              {setKeys.map((key, index) => (
                <div
                  key={key}
                  className={`py-1 transition-opacity duration-300 ${index > setKeys.indexOf(setKey) ? 'opacity-25' : ''}`}
                >
                  <MathTex
                    tex={numberSets[key].definition}
                    className={`text-[17px] whitespace-nowrap ${key === setKey ? 'marker-highlight dark:text-paper' : ''}`}
                  />
                  <p className="ml-3.5 font-hand text-xl leading-snug text-muted">
                    <MathText text={t(`larger.${key}`)} />
                  </p>
                </div>
              ))}
              <MathTex tex={chainTex} className="block pt-2 text-[17px]" />
            </div>
          </div>
        </div>
      }
      detail={
        <NoteCard>
          <p>
            <MathText text={noteText()} />
          </p>
          {selection === null && <p className="mt-2 text-xl text-muted">{t('hint')}</p>}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 border-t border-dashed border-faint pt-3">
            {legendTex.map((entry) => (
              <div key={entry.key} className="contents">
                <dt>
                  <MathTex tex={entry.tex} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">{t(`symbols.${entry.key}`)}</dd>
              </div>
            ))}
            <div className="contents">
              <dt className="flex h-6 w-8.5 items-center justify-center text-[15px]">
                <MathTex tex="2" className="marker-highlight dark:text-paper" />
              </dt>
              <dd className="text-muted">{t('symbols.inside')}</dd>
            </div>
            <div className="contents">
              <dt className="relative flex h-6 w-8.5 items-center justify-center text-[15px]">
                <MathTex tex="0" className="text-marker" />
                <span aria-hidden="true" className={outsideRingClass} />
              </dt>
              <dd className="text-muted">{t('symbols.outside')}</dd>
            </div>
            <div className="contents">
              <dt className={`h-6 w-8.5 ${hatchClass}`} />
              <dd className="text-muted">{t('symbols.undefined')}</dd>
            </div>
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
