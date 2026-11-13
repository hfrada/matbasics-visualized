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
import { CartesianGridBoard, type GridHighlight } from '../components/organisms/CartesianGridBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  letterMember,
  numberMember,
  pairPosition,
  pairTex,
  type Member,
  type NamedSet,
} from '../lib/cartesianProduct'

type ExampleKey = 'aTimesB' | 'bTimesA' | 'mTimesN' | 'nTimesM'

type Example = {
  first: NamedSet
  second: NamedSet
}

type Selection = {
  kind: 'point' | 'column' | 'row'
  index: number
}

const setA: NamedSet = { name: 'A', members: [1, 2, 3].map((index) => letterMember('a', index)) }
const setB: NamedSet = { name: 'B', members: [1, 2].map((index) => letterMember('b', index)) }
const setM: NamedSet = { name: 'M', members: [-1, 2, 4].map((value) => numberMember(value)) }
const setN: NamedSet = { name: 'N', members: [-3, -2, 1, 2].map((value) => numberMember(value)) }

const examples: Record<ExampleKey, Example> = {
  aTimesB: { first: setA, second: setB },
  bTimesA: { first: setB, second: setA },
  mTimesN: { first: setM, second: setN },
  nTimesM: { first: setN, second: setM },
}

const exampleKeys: ExampleKey[] = ['aTimesB', 'bTimesA', 'mTimesN', 'nTimesM']
const delays = [0.5, 1, 1.5, 2, 3]

const legendTex = [
  { key: 'product', tex: '\\times' },
  { key: 'pair', tex: '(a,b)' },
  { key: 'size', tex: '|A|' },
  { key: 'times', tex: '\\cdot' },
] as const

const noHighlight: GridHighlight = { points: [], columns: [], rows: [], vertical: false, horizontal: false }

function setTex(set: NamedSet) {
  return `${set.name}=\\{${set.members.map((member) => member.tex).join(',')}\\}`
}

function hasMember(set: NamedSet, member: Member) {
  return set.members.some((item) => item.tex === member.tex)
}

export function CartesianProductPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.cartesianProduct' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('cartesianProduct')
  const [exampleKey, setExampleKey] = useState<ExampleKey>('aTimesB')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [delay, setDelay] = useState(1)

  const { first, second } = examples[exampleKey]
  const columnCount = first.members.length
  const rowCount = second.members.length
  const total = columnCount * rowCount
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const shown = current === null ? total : current + 1
  const product = `${first.name}\\times ${second.name}`
  const swappedProduct = `${second.name}\\times ${first.name}`
  const names = { first: first.name, second: second.name }

  function pairAt(index: number) {
    const { column, row } = pairPosition(index, rowCount)
    return { column, row, x: first.members[column], y: second.members[row] }
  }

  function highlightOf(focus: Selection | null): GridHighlight {
    if (!focus) return noHighlight
    if (focus.kind === 'point') {
      const { column, row } = pairAt(focus.index)
      return { points: [focus.index], columns: [column], rows: [row], vertical: true, horizontal: true }
    }
    if (focus.kind === 'column') {
      return {
        points: Array.from({ length: rowCount }, (_, row) => focus.index * rowCount + row),
        columns: [focus.index],
        rows: [],
        vertical: true,
        horizontal: false,
      }
    }
    return {
      points: Array.from({ length: columnCount }, (_, column) => column * rowCount + focus.index),
      columns: [],
      rows: [focus.index],
      vertical: false,
      horizontal: true,
    }
  }

  const highlight = highlightOf(current === null ? selection : { kind: 'point', index: current })

  function pairsText(indexes: number[]) {
    return indexes
      .map((index) => {
        const { x, y } = pairAt(index)
        return pairTex(x, y)
      })
      .join('$, $')
  }

  function stepReason(index: number) {
    const { row, x, y } = pairAt(index)
    const step = t('reasons.step', { ...names, x: x.tex, y: y.tex, pair: pairTex(x, y) })
    if (row < rowCount - 1) return step
    return `${step} ${t('reasons.columnDone', { ...names, x: x.tex })}`
  }

  function noteText() {
    if (selection === null) return t('reasons.final', { ...names, product })
    if (selection.kind === 'point') {
      const { x, y } = pairAt(selection.index)
      return t('reasons.point', { ...names, x: x.tex, y: y.tex, pair: pairTex(x, y) })
    }
    if (selection.kind === 'column') {
      return t('reasons.column', {
        ...names,
        x: first.members[selection.index].tex,
        pairs: pairsText(highlight.points),
        count: rowCount,
      })
    }
    return t('reasons.row', {
      ...names,
      y: second.members[selection.index].tex,
      pairs: pairsText(highlight.points),
      count: columnCount,
    })
  }

  function orderLines(index: number) {
    const { x, y } = pairAt(index)
    const pair = pairTex(x, y)
    const swapped = pairTex(y, x)
    const lines = [t('order.swap', { pair, product, swapped, swappedProduct })]
    if (x.tex === y.tex) {
      lines.push(t('order.same', { ...names, pair, x: x.tex }))
    } else {
      lines.push(t('order.differ', { pair, swapped, x: x.tex, y: y.tex }))
      if (!hasMember(first, y)) lines.push(t('order.notFirst', { ...names, swapped, product, y: y.tex }))
      else if (!hasMember(second, x)) lines.push(t('order.notSecond', { ...names, swapped, product, x: x.tex }))
    }
    lines.push(t('order.conclusion', { product, swappedProduct, size: total }))
    return lines
  }

  const groups = Array.from({ length: columnCount }, (_, column) =>
    Math.min(rowCount, Math.max(0, shown - column * rowCount)),
  ).filter((size) => size > 0)
  const sum = groups.length > 1 ? `${groups.join('+')}=${shown}` : `${shown}`
  const firstVariable = first.name.toLowerCase()
  const secondVariable = second.name.toLowerCase()

  function select(kind: Selection['kind'], index: number) {
    setSelection((value) => (value?.kind === kind && value.index === index ? null : { kind, index }))
  }

  function chooseExample(key: ExampleKey) {
    player.stop()
    setSelection(null)
    setExampleKey(key)
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelection(null)
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
            options={exampleKeys.map((key) => ({
              value: key,
              label: `${examples[key].first.name} × ${examples[key].second.name}`,
            }))}
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
      board={
        <div className="pen-border relative bg-paper p-2">
          <CartesianGridBoard
            first={first}
            second={second}
            shown={shown}
            highlight={highlight}
            interactive={!player.playing}
            onSelectPoint={(index) => select('point', index)}
            onSelectColumn={(index) => select('column', index)}
            onSelectRow={(index) => select('row', index)}
          />
        </div>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={current !== null && <MathText text={stepReason(current)} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-5">
          <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('cards.result')}</h2>
            <p className="py-1 text-[17px] leading-loose">
              <MathTex tex={`${product}=\\{`} className="whitespace-nowrap" />{' '}
              {Array.from({ length: shown }, (_, index) => {
                const { x, y } = pairAt(index)
                const tex = pairTex(x, y)
                return (
                  <span key={index}>
                    <MathTex
                      tex={index < shown - 1 ? `${tex},` : tex}
                      className={`whitespace-nowrap ${highlight.points.includes(index) ? 'marker-highlight dark:text-paper' : ''}`}
                    />{' '}
                  </span>
                )
              })}
              <MathTex tex="\}" className="whitespace-nowrap" />
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.rule')}</h2>
              <MathTex
                tex={`${product}=\\{(${firstVariable},${secondVariable})\\mid ${firstVariable}\\in ${first.name},\\ ${secondVariable}\\in ${second.name}\\}`}
                className="block overflow-x-auto py-1 text-[17px]"
              />
              <p className="font-hand text-xl leading-snug">
                <MathText text={t('rule.axes', names)} />
              </p>
              <div className="mt-2 border-t border-dashed border-faint pt-2 text-muted">
                {[first, second].map((set) => (
                  <MathTex key={set.name} tex={setTex(set)} className="block overflow-x-auto py-0.5 text-[15px]" />
                ))}
              </div>
            </div>
            <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.count')}</h2>
              {current === null ? (
                <MathTex tex={`|${product}|=${sum}`} className="block overflow-x-auto py-1 text-[17px]" />
              ) : (
                <p className="py-1 font-hand text-xl leading-snug">
                  <MathText text={t('count.soFar', { sum })} />
                </p>
              )}
              <MathTex
                tex={`|${product}|=|${first.name}|\\cdot|${second.name}|=${columnCount}\\cdot ${rowCount}=${total}`}
                className={`block overflow-x-auto py-1 text-[17px] transition-opacity duration-300 ${current === null ? '' : 'opacity-15'}`}
              />
              <p className="font-hand text-xl leading-snug text-muted">
                <MathText text={t('count.each', { first: first.name, rows: rowCount, columns: columnCount })} />
              </p>
            </div>
          </div>
          <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('cards.order')}</h2>
            {orderLines(highlight.points[0] ?? 0).map((line) => (
              <p key={line} className="font-hand text-xl leading-snug">
                <MathText text={line} />
              </p>
            ))}
          </div>
        </div>
      }
      detail={
        <NoteCard>
          <p>
            <MathText text={noteText()} />
          </p>
          {selection === null && <p className="mt-2 text-xl text-muted">{t('hint')}</p>}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-0.5 border-t border-dashed border-faint pt-3">
            {legendTex.map((entry) => (
              <div key={entry.key} className="contents">
                <dt>
                  <MathTex tex={entry.tex} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">{t(`symbols.${entry.key}`)}</dd>
              </div>
            ))}
            <div className="contents">
              <dt>
                <svg width="30" height="10" aria-hidden="true">
                  <line x1="0" y1="5" x2="30" y2="5" strokeWidth="1.6" strokeDasharray="5 5" className="stroke-faint" />
                </svg>
              </dt>
              <dd className="text-muted">{t('symbols.guide')}</dd>
            </div>
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
