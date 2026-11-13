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
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { VennRegionBoard, type RegionKey } from '../components/organisms/VennRegionBoard'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'

type OperationKey = 'union' | 'intersection' | 'differenceAB' | 'differenceBA' | 'symmetric' | 'complementOfUnion'

type SymbolKey = 'union' | 'intersection' | 'difference' | 'symmetric' | 'complement' | 'notMember'

type Region = {
  key: RegionKey
  inA: boolean
  inB: boolean
}

type Operation = {
  label: string
  name: string
  extra?: string
  takes: (inA: boolean, inB: boolean) => boolean
}

const regions: Region[] = [
  { key: 'onlyA', inA: true, inB: false },
  { key: 'both', inA: true, inB: true },
  { key: 'onlyB', inA: false, inB: true },
  { key: 'outside', inA: false, inB: false },
]

const universe = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const setA = new Set([1, 2, 3, 4, 5])
const setB = new Set([4, 5, 6, 7, 8])
const given = ['S=\\{1,2,\\ldots,9\\}', 'A=\\{1,2,3,4,5\\}', 'B=\\{4,5,6,7,8\\}']

const chipPositions: Record<number, { x: number; y: number }> = {
  1: { x: 175, y: 135 },
  2: { x: 150, y: 200 },
  3: { x: 180, y: 268 },
  4: { x: 320, y: 158 },
  5: { x: 320, y: 238 },
  6: { x: 465, y: 135 },
  7: { x: 490, y: 200 },
  8: { x: 460, y: 268 },
  9: { x: 575, y: 312 },
}

const operations: Record<OperationKey, Operation> = {
  union: { label: 'A ∪ B', name: 'A\\cup B', takes: (inA, inB) => inA || inB },
  intersection: { label: 'A ∩ B', name: 'A\\cap B', takes: (inA, inB) => inA && inB },
  differenceAB: { label: 'A − B', name: 'A-B', takes: (inA, inB) => inA && !inB },
  differenceBA: { label: 'B − A', name: 'B-A', takes: (inA, inB) => inB && !inA },
  symmetric: { label: 'A + B', name: 'A+B', extra: 'A+B=(A-B)\\cup(B-A)', takes: (inA, inB) => inA !== inB },
  complementOfUnion: {
    label: '(A ∪ B)ᶜ',
    name: '(A\\cup B)^C',
    extra: '(A\\cup B)^C=S-(A\\cup B)',
    takes: (inA, inB) => !inA && !inB,
  },
}

const operationKeys: OperationKey[] = [
  'union',
  'intersection',
  'differenceAB',
  'differenceBA',
  'symmetric',
  'complementOfUnion',
]

const symbolTex: Record<SymbolKey, string> = {
  union: '\\cup',
  intersection: '\\cap',
  difference: '-',
  symmetric: '+',
  complement: 'A^C',
  notMember: '\\notin',
}

const symbolKeys: SymbolKey[] = ['union', 'intersection', 'difference', 'symmetric', 'complement', 'notMember']
const delays = [0.5, 1, 1.5, 2, 3]

function regionOf(value: number) {
  return regions.findIndex((region) => region.inA === setA.has(value) && region.inB === setB.has(value))
}

function membership(value: string, inSet: boolean, name: string) {
  return `${value} ${inSet ? '\\in' : '\\notin'} ${name}`
}

export function SetOperationsPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.setOperations' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('setOperations')
  const [operationKey, setOperationKey] = useState<OperationKey>('union')
  const [selected, setSelected] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const operation = operations[operationKey]
  const player = useStepPlayer({ steps: regions.length, delayMs: delay * 1000, travelMs: 0 })
  const finished = player.target === null
  const applied = (index: number) => finished || index <= player.target!
  const takes = (region: Region) => operation.takes(region.inA, region.inB)

  const members = universe.filter((value) => applied(regionOf(value)) && takes(regions[regionOf(value)]))
  const shaded = regions.filter((region, index) => applied(index) && takes(region)).map((region) => region.key)
  const checking = finished ? null : regions[player.target!].key

  const chips = universe.map((value) => {
    const index = regionOf(value)
    return {
      value,
      ...chipPositions[value],
      faded: applied(index) && !takes(regions[index]),
      selected: value === selected,
    }
  })

  const resultLines = [
    { key: 'list', tex: `${operation.name}=\\{${members.join(',')}\\}`, shown: true },
    ...(operation.extra ? [{ key: 'extra', tex: operation.extra, shown: finished }] : []),
    { key: 'count', tex: `|${operation.name}|=${finished ? members.length : '?'}`, shown: finished },
  ]

  function regionReason(region: Region) {
    return t('reasons.region', {
      region: t(`regions.${region.key}`),
      a: membership('x', region.inA, 'A'),
      b: membership('x', region.inB, 'B'),
      verdict: t(takes(region) ? 'reasons.taken' : 'reasons.left', { name: operation.name }),
    })
  }

  function chipReason(value: number) {
    const region = regions[regionOf(value)]
    return t('reasons.chip', {
      a: membership(`${value}`, region.inA, 'A'),
      b: membership(`${value}`, region.inB, 'B'),
      result: membership(`${value}`, takes(region), operation.name),
    })
  }

  function chooseOperation(key: OperationKey) {
    player.stop()
    setSelected(null)
    setOperationKey(key)
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelected(null)
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
            options={operationKeys.map((key) => ({ value: key, label: operations[key].label }))}
            value={operationKey}
            onChange={chooseOperation}
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
          <VennRegionBoard
            shaded={shaded}
            checking={checking}
            chips={chips}
            interactive={!player.playing}
            onSelect={(value) => setSelected((current) => (current === value ? null : value))}
          />
        </div>
      }
      progress={
        <StepProgress
          total={regions.length}
          current={player.target}
          caption={checking && <MathText text={regionReason(regions[player.target!])} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="pen-border relative bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.rule')}</h2>
              <p className="font-hand text-xl leading-snug">
                <MathText text={t(`operations.${operationKey}.meaning`)} />
              </p>
              <MathTex tex={t(`operations.${operationKey}.rule`)} className="block overflow-x-auto py-1 text-[17px]" />
              <div className="mt-2 border-t border-dashed border-faint pt-2 text-muted">
                {given.map((tex) => (
                  <MathTex key={tex} tex={tex} className="block overflow-x-auto py-0.5 text-[15px]" />
                ))}
              </div>
            </div>
            <div className="pen-border relative bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.result')}</h2>
              {resultLines.map((line) => (
                <MathTex
                  key={line.key}
                  tex={line.tex}
                  className={`block overflow-x-auto py-1 text-[17px] transition-opacity duration-300 ${line.shown ? '' : 'opacity-15'}`}
                />
              ))}
            </div>
          </div>
          <div className="pen-border relative bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('cards.regions')}</h2>
            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr className="border-b-2 border-ink text-left font-hand text-xl">
                  <th className="px-2 py-1 font-bold">{t('table.region')}</th>
                  <th className="px-2 py-1 font-bold">
                    <MathTex tex="\in A" />
                  </th>
                  <th className="px-2 py-1 font-bold">
                    <MathTex tex="\in B" />
                  </th>
                  <th className="px-2 py-1 font-bold">{t('table.taken')}</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region, index) => (
                  <tr
                    key={region.key}
                    className={`border-b border-dashed border-faint transition-colors ${checking === region.key ? 'bg-highlight-soft' : ''} ${applied(index) ? '' : 'text-faint'}`}
                  >
                    <td className="px-2 py-1.5">
                      <MathText text={t(`regions.${region.key}`)} />
                      <span className="block text-[13px] text-muted">
                        {universe.filter((value) => regionOf(value) === index).join(', ')}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 font-hand text-xl">{t(region.inA ? 'table.yes' : 'table.no')}</td>
                    <td className="px-2 py-1.5 font-hand text-xl">{t(region.inB ? 'table.yes' : 'table.no')}</td>
                    <td className="px-2 py-1.5 font-hand text-xl">
                      {applied(index) &&
                        (takes(region) ? (
                          <span className="marker-highlight font-bold">{t('table.in')}</span>
                        ) : (
                          <span className="text-muted">{t('table.out')}</span>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
      detail={
        <NoteCard>
          {selected === null ? (
            <>
              <p>
                <MathText text={t('reasons.final', { name: operation.name })} />
              </p>
              <ul className="mt-1 list-inside list-disc">
                {regions
                  .filter((region) => takes(region))
                  .map((region) => (
                    <li key={region.key}>
                      <MathText text={t(`regions.${region.key}`)} />
                    </li>
                  ))}
              </ul>
              <p className="mt-2 text-muted">{t('hint')}</p>
            </>
          ) : (
            <p>
              <MathText text={chipReason(selected)} />
            </p>
          )}
          <dl className="mt-4 grid grid-cols-[2.25rem_1fr] items-baseline gap-y-0.5 border-t border-dashed border-faint pt-3">
            {symbolKeys.map((key) => (
              <div key={key} className="contents">
                <dt>
                  <MathTex tex={symbolTex[key]} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">{t(`symbols.${key}`)}</dd>
              </div>
            ))}
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
