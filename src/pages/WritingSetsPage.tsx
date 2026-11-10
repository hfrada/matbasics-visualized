import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { Title } from '../components/atoms/Title'
import { NoteCard } from '../components/molecules/NoteCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PlayButton } from '../components/molecules/PlayButton'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { SetListingBoard, type BoardChip } from '../components/organisms/SetListingBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'

type PileObject = {
  label: string
  tex: string
  value?: number
}

type SetKey = 'below10' | 'vowels' | 'empty' | 'natural'

type ReasonKey =
  | 'naturalBelow10'
  | 'notNumber'
  | 'zero'
  | 'notNatural'
  | 'vowel'
  | 'consonant'
  | 'notLetter'
  | 'notBelow1'
  | 'natural'

type SetRule = {
  name: string
  symbol: string
  infinite: boolean
  contains: (object: PileObject) => boolean
  order: (a: PileObject, b: PileObject) => number
  reason: (object: PileObject) => ReasonKey
}

const pile: PileObject[] = [
  { label: '3', tex: '3', value: 3 },
  { label: 'a', tex: 'a' },
  { label: '½', tex: '\\tfrac{1}{2}', value: 0.5 },
  { label: '7', tex: '7', value: 7 },
  { label: 'o', tex: 'o' },
  { label: '0', tex: '0', value: 0 },
  { label: 'k', tex: 'k' },
  { label: '1', tex: '1', value: 1 },
  { label: 'e', tex: 'e' },
  { label: '9', tex: '9', value: 9 },
  { label: '−1', tex: '-1', value: -1 },
  { label: 'i', tex: 'i' },
  { label: '5', tex: '5', value: 5 },
  { label: 'z', tex: 'z' },
  { label: '2', tex: '2', value: 2 },
  { label: 'u', tex: 'u' },
  { label: '8', tex: '8', value: 8 },
  { label: 'b', tex: 'b' },
  { label: '4', tex: '4', value: 4 },
  { label: '6', tex: '6', value: 6 },
]

const vowels = ['a', 'i', 'u', 'e', 'o']
const continuation = ['10', '11']

function isNumber(object: PileObject) {
  return object.value !== undefined
}

function isNatural(object: PileObject) {
  return isNumber(object) && Number.isInteger(object.value) && object.value! >= 1
}

function nonNaturalReason(object: PileObject): ReasonKey {
  if (!isNumber(object)) return 'notNumber'
  return object.value === 0 ? 'zero' : 'notNatural'
}

const byValue = (a: PileObject, b: PileObject) => a.value! - b.value!

const setRules: Record<SetKey, SetRule> = {
  below10: {
    name: 'N',
    symbol: 'N',
    infinite: false,
    contains: (object) => isNatural(object) && object.value! < 10,
    order: byValue,
    reason: (object) => (isNatural(object) ? 'naturalBelow10' : nonNaturalReason(object)),
  },
  vowels: {
    name: 'V',
    symbol: 'V',
    infinite: false,
    contains: (object) => vowels.includes(object.label),
    order: (a, b) => vowels.indexOf(a.label) - vowels.indexOf(b.label),
    reason: (object) => {
      if (isNumber(object)) return 'notLetter'
      return vowels.includes(object.label) ? 'vowel' : 'consonant'
    },
  },
  empty: {
    name: '∅',
    symbol: '\\emptyset',
    infinite: false,
    contains: () => false,
    order: () => 0,
    reason: (object) => (isNatural(object) ? 'notBelow1' : nonNaturalReason(object)),
  },
  natural: {
    name: 'ℕ',
    symbol: '\\mathbb{N}',
    infinite: true,
    contains: isNatural,
    order: byValue,
    reason: (object) => (isNatural(object) ? 'natural' : nonNaturalReason(object)),
  },
}

const setKeys: SetKey[] = ['below10', 'vowels', 'empty', 'natural']
const delays = [0.5, 1, 1.5, 2, 3]
const moveMs = 700

export function WritingSetsPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.writingSets' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('writingSets')
  const [setKey, setSetKey] = useState<SetKey>('below10')
  const [selected, setSelected] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const rule = setRules[setKey]
  const totalSteps = pile.length + (rule.infinite ? 1 : 0)
  const player = useStepPlayer({ steps: totalSteps, delayMs: delay * 1000, travelMs: moveMs })

  const checkedCount = player.target === null ? pile.length : Math.min(player.target + 1, pile.length)
  const checkingIndex = player.target !== null && player.target < pile.length ? player.target : null
  const continued = rule.infinite && (player.target === null || player.target >= pile.length)
  const finished = player.target === null

  const members = pile.filter(rule.contains).sort(rule.order)
  const found = members.filter((object) => pile.indexOf(object) < checkedCount)

  const chips: BoardChip[] = pile.map((object, index) => {
    const checked = index < checkedCount
    const member = rule.contains(object)
    return {
      label: object.label,
      italic: !isNumber(object),
      status: checked ? (member ? 'member' : 'rejected') : 'waiting',
      checking: index === checkingIndex,
      slot: member ? members.indexOf(object) : null,
      selected: index === selected,
    }
  })

  function reasonLine(object: PileObject) {
    const relation = rule.contains(object) ? '\\in' : '\\notin'
    return (
      <>
        <MathTex tex={`${object.tex} ${relation} ${rule.symbol}`} className="mr-2 text-[0.8em]" />
        {t(`reasons.${rule.reason(object)}`, { x: object.label })}
      </>
    )
  }

  function listTex() {
    if (setKey === 'empty') return finished ? '\\emptyset=\\{\\ \\}' : '\\{\\ \\}'
    const entries = found.map((object) => object.tex)
    if (continued) entries.push(...continuation, '\\dots')
    return `${rule.symbol}=\\{${entries.join(', ')}\\}`
  }

  function countText() {
    if (!finished) return t('count.found', { count: found.length })
    if (setKey === 'empty') return t('count.empty')
    if (rule.infinite) return t('count.infinite')
    return t('count.finite', { count: members.length, name: rule.name })
  }

  function progressCaption() {
    if (checkingIndex !== null) return reasonLine(pile[checkingIndex])
    if (continued) return t('reasons.continues')
    return null
  }

  function chooseSet(key: SetKey) {
    player.stop()
    setSelected(null)
    setSetKey(key)
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
            options={setKeys.map((key) => ({ value: key, label: t(`tabs.${key}`) }))}
            value={setKey}
            onChange={chooseSet}
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
      stage={
        <div className="grid gap-5">
          <div className="pen-border relative bg-paper p-2">
            <SetListingBoard
              chips={chips}
              memberCount={members.length}
              continuation={continued ? continuation : []}
              emptyResult={setKey === 'empty' && finished}
              trayLabel={t('tray')}
              interactive={!player.playing}
              onSelect={(index) => setSelected((current) => (current === index ? null : index))}
            />
          </div>
          <div className="pen-border relative bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('forms.rule')}</h2>
            <MathTex tex={t(`rules.${setKey}`)} className="block overflow-x-auto py-1.5 text-[17px]" />
          </div>
          <div className="pen-border relative bg-paper px-4.5 py-3">
            <h2 className="font-hand text-2xl font-bold">{t('forms.list')}</h2>
            <MathTex tex={listTex()} className="block overflow-x-auto py-1.5 text-[17px]" />
          </div>
          <p aria-live="polite" className="font-hand text-2xl">
            {countText()}
          </p>
        </div>
      }
      detail={
        <NoteCard>
          {selected === null ? <p className="text-muted">{t('hint')}</p> : <p>{reasonLine(pile[selected])}</p>}
        </NoteCard>
      }
      progress={
        player.target !== null && (
          <StepProgress compact total={totalSteps} current={player.target} caption={progressCaption()} />
        )
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
