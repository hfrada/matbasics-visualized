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
import { PowerSetTreeBoard } from '../components/organisms/PowerSetTreeBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import { leafMembers } from '../lib/powerSet'

type ExampleKey = 'one' | 'two' | 'three' | 'four'

type Example = {
  name: string
  members: string[]
  italic: boolean
}

type Step = {
  level: number
  leaf: number | null
}

const examples: Record<ExampleKey, Example> = {
  one: { name: 'K', members: ['5'], italic: false },
  two: { name: 'A', members: ['1', '2'], italic: false },
  three: { name: 'B', members: ['a', 'b', 'c'], italic: true },
  four: { name: 'C', members: ['1', '2', '3', '4'], italic: false },
}

const exampleKeys: ExampleKey[] = ['one', 'two', 'three', 'four']
const delays = [0.5, 1, 1.5, 2, 3]

const legendTex = [
  { key: 'powerSet', tex: 'P(A)' },
  { key: 'empty', tex: '\\emptyset' },
  { key: 'size', tex: '|A|' },
] as const

function stepsOf(example: Example): Step[] {
  const n = example.members.length
  return [
    ...example.members.map((_, index) => ({ level: index + 1, leaf: null })),
    ...Array.from({ length: 2 ** n }, (_, leaf) => ({ level: n, leaf })),
  ]
}

function setTex(items: string[]) {
  return items.length > 0 ? `\\{${items.join(',')}\\}` : '\\emptyset'
}

function moduleOrder(members: string[]) {
  const leaves = Array.from({ length: 2 ** members.length }, (_, leaf) => leaf)
  const indexes = (leaf: number) => leafMembers(members, leaf).map((item) => members.indexOf(item))
  return leaves.sort((first, second) => {
    const a = indexes(first)
    const b = indexes(second)
    if (a.length !== b.length) return a.length - b.length
    const differ = a.findIndex((value, index) => value !== b[index])
    return differ === -1 ? 0 : a[differ] - b[differ]
  })
}

export function PowerSetPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.powerSet' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('powerSet')
  const [exampleKey, setExampleKey] = useState<ExampleKey>('three')
  const [selected, setSelected] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const example = examples[exampleKey]
  const n = example.members.length
  const steps = stepsOf(example)
  const player = useStepPlayer({ steps: steps.length, delayMs: delay * 1000, travelMs: 0 })

  const current = player.target === null ? null : steps[player.target]
  const level = current?.level ?? n
  const listed = current ? (current.leaf === null ? 0 : current.leaf + 1) : 2 ** n
  const active = current ? current.leaf : selected

  const product = level > 0 ? Array.from({ length: level }, () => '2').join('\\times ') : '1'
  const countTex = level === n ? `|P(${example.name})|=${product}=2^{${n}}=${2 ** n}` : `${product}=${2 ** level}`
  const listedItems = moduleOrder(example.members)
    .filter((leaf) => leaf < listed)
    .map((leaf) => setTex(leafMembers(example.members, leaf)))

  function leafReason(leaf: number) {
    const inside = leafMembers(example.members, leaf)
    const path = example.members
      .map((x) => t(inside.includes(x) ? 'choice.in' : 'choice.out', { x }))
      .join(', ')
    return t('reasons.leaf', { path, set: setTex(inside) })
  }

  function stepReason(step: Step) {
    if (step.leaf !== null) return leafReason(step.leaf)
    return t('reasons.level', { x: example.members[step.level - 1], branches: 2 ** step.level })
  }

  function chooseExample(key: ExampleKey) {
    player.stop()
    setSelected(null)
    setExampleKey(key)
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
            options={exampleKeys.map((key) => ({
              value: key,
              label: `P(${examples[key].name}), n = ${examples[key].members.length}`,
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
          <PowerSetTreeBoard
            members={example.members}
            italic={example.italic}
            level={level}
            listed={listed}
            active={active}
            choicesLabel={t('choices')}
            interactive={!player.playing}
            onSelect={(leaf) => setSelected((value) => (value === leaf ? null : leaf))}
          />
        </div>
      }
      progress={
        <StepProgress
          total={steps.length}
          current={player.target}
          caption={current && <MathText text={stepReason(current)} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.powerSet')}</h2>
              <p className="py-1 text-[17px] leading-loose">
                <MathTex tex={`P(${example.name})=\\{`} className="whitespace-nowrap" />{' '}
                {listedItems.map((tex, index) => (
                  <span key={tex}>
                    <MathTex tex={index < listedItems.length - 1 ? `${tex},` : tex} className="whitespace-nowrap" />{' '}
                  </span>
                ))}
                <MathTex tex="\}" className="whitespace-nowrap" />
              </p>
              <MathTex
                tex={`${example.name}=\\{${example.members.join(',')}\\}`}
                className="block overflow-x-auto py-1 text-[17px] text-muted"
              />
            </div>
            <div className="pen-border relative min-w-0 bg-paper px-4.5 py-3">
              <h2 className="font-hand text-2xl font-bold">{t('cards.count')}</h2>
              <MathTex tex={countTex} className="block overflow-x-auto py-1 text-[17px]" />
              <MathTex
                tex={`n=|${example.name}|=${n}`}
                className="block overflow-x-auto py-1 text-[17px] text-muted"
              />
            </div>
          </div>
        </div>
      }
      detail={
        <NoteCard>
          {selected === null ? (
            <>
              <p>
                <MathText
                  text={t('reasons.final', { name: example.name, power: `2^{${n}}=${2 ** n}` })}
                />
              </p>
              <p className="mt-2 text-xl text-muted">{t('hint')}</p>
            </>
          ) : (
            <p>
              <MathText text={leafReason(selected)} />
            </p>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-0.5 border-t border-dashed border-faint pt-3">
            {legendTex.map((entry) => (
              <div key={entry.key} className="contents">
                <dt>
                  <MathTex tex={entry.tex} className="text-[0.75em]" />
                </dt>
                <dd className="text-muted">{t(`symbols.${entry.key}`)}</dd>
              </div>
            ))}
            {(['in', 'out'] as const).map((key) => (
              <div key={key} className="contents">
                <dt>
                  <svg width="30" height="10" aria-hidden="true">
                    <line
                      x1="0"
                      y1="5"
                      x2="30"
                      y2="5"
                      strokeWidth={key === 'in' ? 2 : 1.6}
                      strokeDasharray={key === 'in' ? undefined : '5 5'}
                      className={key === 'in' ? 'stroke-ink' : 'stroke-faint'}
                    />
                  </svg>
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
