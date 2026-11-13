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
import { VennLawBoard } from '../components/organisms/VennLawBoard'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  buildOrder,
  complement,
  contains,
  expressionTex,
  intersection,
  namedSet,
  union,
  type CombinedSet,
  type SetExpression,
} from '../lib/setExpression'

type LawKey =
  | 'deMorganUnion'
  | 'deMorganIntersection'
  | 'distributiveUnion'
  | 'distributiveIntersection'
  | 'associativeUnion'

type RegionKey =
  | 'onlyA'
  | 'both'
  | 'onlyB'
  | 'outsideBoth'
  | 'onlyAB'
  | 'onlyAC'
  | 'all'
  | 'onlyBC'
  | 'onlyC'
  | 'outsideAll'

type Region = {
  key: RegionKey
  memberships: boolean[]
}

type Law = {
  names: string[]
  regions: Region[]
  left: SetExpression
  right: SetExpression
}

type SideKey = 'left' | 'right'

type OtherLawKey = 'identity' | 'idempotent' | 'commutative' | 'complement' | 'order'

type SymbolKey = 'union' | 'intersection' | 'complement' | 'member' | 'notMember'

const twoSetRegions: Region[] = [
  { key: 'onlyA', memberships: [true, false] },
  { key: 'both', memberships: [true, true] },
  { key: 'onlyB', memberships: [false, true] },
  { key: 'outsideBoth', memberships: [false, false] },
]

const threeSetRegions: Region[] = [
  { key: 'onlyA', memberships: [true, false, false] },
  { key: 'onlyAB', memberships: [true, true, false] },
  { key: 'onlyB', memberships: [false, true, false] },
  { key: 'onlyAC', memberships: [true, false, true] },
  { key: 'all', memberships: [true, true, true] },
  { key: 'onlyBC', memberships: [false, true, true] },
  { key: 'onlyC', memberships: [false, false, true] },
  { key: 'outsideAll', memberships: [false, false, false] },
]

const setA = namedSet('A', 0)
const setB = namedSet('B', 1)
const setC = namedSet('C', 2)
const twoSets = { names: ['A', 'B'], regions: twoSetRegions }
const threeSets = { names: ['A', 'B', 'C'], regions: threeSetRegions }

const laws: Record<LawKey, Law> = {
  deMorganUnion: {
    ...twoSets,
    left: complement(union(setA, setB)),
    right: intersection(complement(setA), complement(setB)),
  },
  deMorganIntersection: {
    ...twoSets,
    left: complement(intersection(setA, setB)),
    right: union(complement(setA), complement(setB)),
  },
  distributiveUnion: {
    ...threeSets,
    left: union(setA, intersection(setB, setC)),
    right: intersection(union(setA, setB), union(setA, setC)),
  },
  distributiveIntersection: {
    ...threeSets,
    left: intersection(setA, union(setB, setC)),
    right: union(intersection(setA, setB), intersection(setA, setC)),
  },
  associativeUnion: {
    ...threeSets,
    left: union(setA, union(setB, setC)),
    right: union(union(setA, setB), setC),
  },
}

const lawKeys: LawKey[] = [
  'deMorganUnion',
  'deMorganIntersection',
  'distributiveUnion',
  'distributiveIntersection',
  'associativeUnion',
]

const otherLaws: Record<OtherLawKey, string[]> = {
  identity: ['A \\cup S = S', 'A \\cap \\varnothing = \\varnothing', 'A \\cup \\varnothing = A', 'A \\cap S = A'],
  idempotent: ['A \\cup A = A \\cap A = A'],
  commutative: ['A \\cup B = B \\cup A', 'A \\cap B = B \\cap A'],
  complement: ['A \\cup A^C = S', 'A \\cap A^C = \\varnothing', '(A^C)^C = A', 'S^C = \\varnothing', '\\varnothing^C = S'],
  order: ['\\varnothing \\subseteq (A \\cap B) \\subseteq A \\subseteq (A \\cup B)'],
}

const otherLawKeys: OtherLawKey[] = ['identity', 'idempotent', 'commutative', 'complement', 'order']

const symbolTex: Record<SymbolKey, string> = {
  union: '\\cup',
  intersection: '\\cap',
  complement: 'A^C',
  member: '\\in',
  notMember: '\\notin',
}

const symbolKeys: SymbolKey[] = ['union', 'intersection', 'complement', 'member', 'notMember']
const delays = [0.5, 1, 1.5, 2, 3]

function membership(inSet: boolean, name: string) {
  return `x ${inSet ? '\\in' : '\\notin'} ${name}`
}

function sameMemberships(first: boolean[], second: boolean[]) {
  return first.every((value, index) => value === second[index])
}

export function SetOperationPropertiesPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.setOperationProperties' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('setOperationProperties')
  const [lawKey, setLawKey] = useState<LawKey>('deMorganUnion')
  const [selected, setSelected] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const law = laws[lawKey]
  const steps: Record<SideKey, CombinedSet[]> = { left: buildOrder(law.left), right: buildOrder(law.right) }
  const totalSteps = steps.left.length + steps.right.length + law.regions.length
  const player = useStepPlayer({ steps: totalSteps, delayMs: delay * 1000, travelMs: 0 })
  const step = player.target

  const rightStart = steps.left.length
  const compareStart = rightStart + steps.right.length
  const drawingSide: SideKey | null = step === null || step >= compareStart ? null : step < rightStart ? 'left' : 'right'
  const shownStep: Record<SideKey, number> = {
    left: step !== null && step < rightStart ? step : steps.left.length - 1,
    right: step === null || step >= compareStart ? steps.right.length - 1 : step - rightStart,
  }
  const sideDone: Record<SideKey, boolean> = {
    left: step === null || step >= rightStart,
    right: step === null || step >= compareStart,
  }
  const checking = step !== null && step >= compareStart ? step - compareStart : null
  const compared = (index: number) => step === null || (checking !== null && index <= checking)
  const hatchedIndex = selected ?? checking

  const leftHas = (region: Region) => contains(law.left, region.memberships)
  const rightHas = (region: Region) => contains(law.right, region.memberships)

  function shadedBy(expression: SetExpression | undefined) {
    if (!expression) return []
    return law.regions.map((region) => region.memberships).filter((memberships) => contains(expression, memberships))
  }

  function describe(expression: CombinedSet) {
    if (expression.kind === 'complement') {
      return t(expression.of.kind === 'set' ? 'describe.complementOfSet' : 'describe.complementOfResult', {
        x: expressionTex(expression.of),
      })
    }
    return t(`describe.${expression.kind}`, { x: expressionTex(expression.left), y: expressionTex(expression.right) })
  }

  function boardCaption(side: SideKey) {
    if (side === 'right' && shownStep.right < 0) return t('board.notYet')
    const label = drawingSide === side ? t('board.drawing') : t(`board.${side}`)
    return `${label} $${expressionTex(steps[side][shownStep[side]])}$`
  }

  function chain(side: SideKey, region: Region) {
    return steps[side]
      .map((expression) => `$${membership(contains(expression, region.memberships), expressionTex(expression))}$`)
      .join(', ')
  }

  function inOrOut(inside: boolean) {
    return t(inside ? 'table.in' : 'table.out')
  }

  function stepCaption() {
    if (step === null) return null
    if (drawingSide) {
      const expression = steps[drawingSide][shownStep[drawingSide]]
      return t('reasons.build', { tex: expressionTex(expression), description: describe(expression) })
    }
    const region = law.regions[checking!]
    return t('reasons.compare', {
      region: t(`regions.${region.key}`),
      left: inOrOut(leftHas(region)),
      right: inOrOut(rightHas(region)),
    })
  }

  function chooseLaw(key: LawKey) {
    player.stop()
    setSelected(null)
    setLawKey(key)
  }

  function togglePlayback() {
    if (player.playing) {
      player.stop()
      return
    }
    setSelected(null)
    player.start()
  }

  function toggleRegion(index: number) {
    if (player.playing) return
    setSelected((current) => (current === index ? null : index))
  }

  function selectAt(memberships: boolean[]) {
    toggleRegion(law.regions.findIndex((region) => sameMemberships(region.memberships, memberships)))
  }

  function sideBoard(side: SideKey) {
    return (
      <div className="text-center">
        <p className="font-hand text-xl text-muted">
          <MathText text={boardCaption(side)} />
        </p>
        <VennLawBoard
          names={law.names}
          shaded={shadedBy(shownStep[side] >= 0 ? steps[side][shownStep[side]] : undefined)}
          hatched={hatchedIndex === null ? null : law.regions[hatchedIndex].memberships}
          onSelect={player.playing ? undefined : selectAt}
        />
      </div>
    )
  }

  const caption = stepCaption()

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup
            options={lawKeys.map((key) => ({ value: key, label: t(`laws.${key}`) }))}
            value={lawKey}
            onChange={chooseLaw}
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
        <>
          <MathTex
            tex={`${expressionTex(law.left)} = ${expressionTex(law.right)}`}
            className="block overflow-x-auto text-[22px]"
          />
          <div className="pen-border relative bg-paper px-2 pt-2.5 pb-1.5">
            <div className="grid items-center gap-1.5 sm:grid-cols-[1fr_auto_1fr]">
              {sideBoard('left')}
              <span
                className={`text-center font-math text-[34px] transition-colors duration-300 ${step === null ? 'text-ink' : 'text-faint'}`}
              >
                =
              </span>
              {sideBoard('right')}
            </div>
          </div>
        </>
      }
      progress={
        <StepProgress
          total={totalSteps}
          current={step}
          caption={caption && <MathText text={caption} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {(['left', 'right'] as SideKey[]).map((side) => (
              <div key={side} className="pen-border relative bg-paper px-4.5 py-3">
                <h2 className="font-hand text-2xl font-bold">{t(`cards.${side}`)}</h2>
                <ol className="grid gap-1.5">
                  {steps[side].map((expression, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-2.5 rounded-sm px-1.5 py-1 transition-opacity duration-300 ${drawingSide === side && index === shownStep[side] ? 'bg-highlight-soft' : ''} ${index > shownStep[side] ? 'opacity-30' : ''}`}
                    >
                      <div className="w-23 flex-none">
                        <VennLawBoard names={law.names} shaded={shadedBy(expression)} hatched={null} mini />
                      </div>
                      <div>
                        <MathTex tex={expressionTex(expression)} className="text-[17px]" />
                        <p className="text-[13px] text-muted">
                          <MathText text={describe(expression)} />
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <div className="pen-border relative overflow-x-auto bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('cards.regions')}</h2>
            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr className="border-b-2 border-ink text-left font-hand text-xl whitespace-nowrap">
                  <th className="px-2 py-1 font-bold">{t('table.region')}</th>
                  {law.names.map((name) => (
                    <th key={name} className="px-2 py-1 font-bold">
                      <MathTex tex={`\\in ${name}`} />
                    </th>
                  ))}
                  <th className="px-2 py-1 font-bold">{t('table.left')}</th>
                  <th className="px-2 py-1 font-bold">{t('table.right')}</th>
                  <th className="px-2 py-1 font-bold">{t('table.same')}</th>
                </tr>
              </thead>
              <tbody>
                {law.regions.map((region, index) => (
                  <tr
                    key={region.key}
                    className={`border-b border-dashed border-faint transition-colors ${hatchedIndex === index ? 'bg-highlight-soft' : ''}`}
                  >
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        aria-label={t(`regions.${region.key}`).replaceAll('$', '')}
                        aria-pressed={selected === index}
                        disabled={player.playing}
                        onClick={() => toggleRegion(index)}
                        className="cursor-pointer text-left underline decoration-faint decoration-dashed underline-offset-4 disabled:cursor-default disabled:no-underline"
                      >
                        <MathText text={t(`regions.${region.key}`)} />
                      </button>
                    </td>
                    {region.memberships.map((inside, setIndex) => (
                      <td key={setIndex} className="px-2 py-1.5 font-hand text-xl">
                        {t(inside ? 'table.yes' : 'table.no')}
                      </td>
                    ))}
                    {([leftHas(region), rightHas(region)] as boolean[]).map((inside, sideIndex) => (
                      <td key={sideIndex} className="px-2 py-1.5 font-hand text-xl">
                        {sideDone[sideIndex === 0 ? 'left' : 'right'] &&
                          (inside ? (
                            <span className="marker-highlight font-bold">{t('table.in')}</span>
                          ) : (
                            <span className="text-muted">{t('table.out')}</span>
                          ))}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 font-hand text-xl font-bold">
                      {compared(index) && t(leftHas(region) === rightHas(region) ? 'table.equal' : 'table.different')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pen-border relative bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('cards.others')}</h2>
            {otherLawKeys.map((key) => (
              <div key={key} className="my-1 flex flex-wrap items-baseline gap-x-4.5 gap-y-1">
                <span className="min-w-25 font-hand text-xl text-muted">{t(`others.${key}`)}</span>
                {otherLaws[key].map((tex) => (
                  <MathTex key={tex} tex={tex} className="text-[16px]" />
                ))}
              </div>
            ))}
          </div>
        </div>
      }
      detail={
        <NoteCard>
          {selected === null ? (
            <>
              <p>{t('reasons.final')}</p>
              <ul className="mt-1 list-inside list-disc">
                {law.regions.filter(leftHas).map((region) => (
                  <li key={region.key}>
                    <MathText text={t(`regions.${region.key}`)} />
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                <MathText text={t('reasons.coverage', { sets: law.names.join(', ') })} />
              </p>
              <p className="mt-2 text-muted">{t('hint')}</p>
            </>
          ) : (
            <>
              <p>
                <MathText
                  text={t('reasons.region', {
                    region: t(`regions.${law.regions[selected].key}`),
                    where: law.names
                      .map((name, index) => `$${membership(law.regions[selected].memberships[index], name)}$`)
                      .join(', '),
                  })}
                />
              </p>
              <p className="mt-1.5">
                <MathText text={t('reasons.leftChain', { chain: chain('left', law.regions[selected]) })} />
              </p>
              <p>
                <MathText text={t('reasons.rightChain', { chain: chain('right', law.regions[selected]) })} />
              </p>
              <p className="mt-1.5">{t(leftHas(law.regions[selected]) ? 'reasons.bothIn' : 'reasons.bothOut')}</p>
            </>
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
