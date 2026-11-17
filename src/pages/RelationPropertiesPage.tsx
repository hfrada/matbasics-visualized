import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MathTex } from '../components/atoms/MathTex'
import { MathText } from '../components/atoms/MathText'
import { Stamp } from '../components/atoms/Stamp'
import { TabButton } from '../components/atoms/TabButton'
import { Title } from '../components/atoms/Title'
import { NoteCard } from '../components/molecules/NoteCard'
import { PenSelect } from '../components/molecules/PenSelect'
import { PlayButton } from '../components/molecules/PlayButton'
import { SetItemsList } from '../components/molecules/SetItemsList'
import { StepProgress } from '../components/molecules/StepProgress'
import { TabGroup } from '../components/molecules/TabGroup'
import { TitledCard } from '../components/molecules/TitledCard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { InequalityStepsTable, type StepTableRow } from '../components/organisms/InequalityStepsTable'
import { RelationDigraphBoard, type DigraphMark } from '../components/organisms/RelationDigraphBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  checkProperty,
  equivalenceClasses,
  propertyKeys,
  relationMatrix,
  relationPairs,
  type IndexPair,
  type PropertyCase,
  type PropertyCheck,
  type PropertyKey,
  type RelationMatrix,
} from '../lib/relationProperties'

type GroupKey = PropertyKey | 'equivalence'
type SampleKey = 'equal' | 'lessEq' | 'less' | 'divides' | 'sameParity' | 'diffOne' | 'modThree' | 'listed'
type TestKind = 'truth' | 'parity' | 'multiple' | 'list'
type FormulaKey = GroupKey | 'class'
type LegendKey = 'arrow' | 'loop' | 'cell' | 'diagonal' | 'now' | 'need' | 'missing'

type Sample = {
  values: number[]
  test: TestKind
  holds: (a: number, b: number) => boolean
  expression: (a: number, b: number) => string
}

type BoardStep = {
  row: StepTableRow
  caption: string
  marks: DigraphMark[]
  lit: number[]
}

const delays = [0.5, 1, 1.5, 2, 3]
const groupKeys: GroupKey[] = ['reflexive', 'symmetric', 'antisymmetric', 'transitive', 'equivalence']
const groupSamples: Record<GroupKey, SampleKey[]> = {
  reflexive: ['lessEq', 'less', 'divides', 'listed'],
  symmetric: ['diffOne', 'sameParity', 'lessEq', 'listed'],
  antisymmetric: ['lessEq', 'divides', 'diffOne', 'equal'],
  transitive: ['less', 'divides', 'diffOne', 'listed'],
  equivalence: ['sameParity', 'modThree', 'equal', 'lessEq'],
}
const formulaKeys: FormulaKey[] = ['reflexive', 'symmetric', 'antisymmetric', 'transitive', 'equivalence', 'class']
const legendKeys: LegendKey[] = ['arrow', 'loop', 'cell', 'diagonal', 'now', 'need', 'missing']
const equivalenceParts: PropertyKey[] = ['reflexive', 'symmetric', 'transitive']
const footnoteClass = 'mt-3 text-sm text-muted'
const cellClass = 'border-t border-dashed border-faint py-2 pr-3 pl-1.5 align-middle'
const listed: IndexPair[] = [
  [1, 1],
  [2, 2],
  [3, 3],
  [1, 2],
  [2, 1],
  [2, 3],
]

const samples: Record<SampleKey, Sample> = {
  equal: { values: [1, 2, 3, 4], test: 'truth', holds: (a, b) => a === b, expression: (a, b) => `${a} = ${b}` },
  lessEq: { values: [1, 2, 3, 4], test: 'truth', holds: (a, b) => a <= b, expression: (a, b) => `${a} \\le ${b}` },
  less: { values: [1, 2, 3, 4], test: 'truth', holds: (a, b) => a < b, expression: (a, b) => `${a} < ${b}` },
  divides: { values: [1, 2, 3, 4, 6], test: 'truth', holds: (a, b) => b % a === 0, expression: (a, b) => `${a} \\mid ${b}` },
  sameParity: { values: [1, 2, 3, 4, 5, 6], test: 'parity', holds: (a, b) => (a + b) % 2 === 0, expression: (a, b) => `${a} + ${b} = ${a + b}` },
  diffOne: { values: [1, 2, 3, 4], test: 'truth', holds: (a, b) => Math.abs(a - b) === 1, expression: (a, b) => `|${a} - ${b}| = 1` },
  modThree: {
    values: [1, 2, 3, 4, 5, 6, 7],
    test: 'multiple',
    holds: (a, b) => (a - b) % 3 === 0,
    expression: (a, b) => `${a} - ${b} = ${a - b}`,
  },
  listed: {
    values: [1, 2, 3, 4],
    test: 'list',
    holds: (a, b) => listed.some(([p, q]) => p === a && q === b),
    expression: (a, b) => `(${a}, ${b})`,
  },
}

const pairTex = (values: number[], [i, j]: IndexPair) => `(${values[i]}, ${values[j]})`
const setTex = (values: number[]) => `\\{${values.join(', ')}\\}`
const memberTex = (inR: boolean) => (inR ? '\\in' : '\\notin')

export function RelationPropertiesPage() {
  const { t } = useTranslation('translation', { keyPrefix: 'topics.relationProperties' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('relationProperties')
  const [group, setGroup] = useState<GroupKey>('reflexive')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [delay, setDelay] = useState(1.5)

  const sampleKey = groupSamples[group][exampleIndex]
  const sample = samples[sampleKey]
  const { values } = sample
  const matrix: RelationMatrix = relationMatrix(values.length, (i, j) => sample.holds(values[i], values[j]))
  const checks = Object.fromEntries(propertyKeys.map((key) => [key, checkProperty(matrix, key)])) as Record<PropertyKey, PropertyCheck>
  const isEquivalence = equivalenceParts.every((key) => checks[key].holds)
  const classes = isEquivalence ? equivalenceClasses(matrix) : []
  const pairOf = (pair: IndexPair) => pairTex(values, pair)

  function why([i, j]: IndexPair) {
    const a = values[i]
    const b = values[j]
    const holds = sample.holds(a, b)
    const expression = sample.expression(a, b)
    if (sample.test === 'list') return t(holds ? 'why.listed' : 'why.unlisted', { pair: expression })
    const verdict = t(`words.${sample.test}.${holds}`)
    return t('why.rule', { expression, verdict })
  }

  function caseTex(key: PropertyKey, entry: PropertyCase) {
    const need = pairOf(entry.need)
    const ask = `${need} \\overset{?}{${entry.wantIn ? '\\in' : '\\notin'}} \\mathrm R`
    if (key === 'reflexive') return `a = ${values[entry.need[0]]}:\\ ${ask}`
    return `${entry.premises.map(pairOf).join(', ')} \\in \\mathrm R \\Rightarrow ${ask}`
  }

  function counterTex(entry: PropertyCase) {
    const need = `${pairOf(entry.need)} ${memberTex(!entry.wantIn)} \\mathrm R`
    return entry.premises.length === 0 ? need : `${entry.premises.map(pairOf).join(', ')} \\in \\mathrm R,\\ ${need}`
  }

  function verdictText(key: PropertyKey) {
    const check = checks[key]
    const name = t(`names.${key}`)
    if (check.failure) return t('verdict.no', { counter: counterTex(check.failure), name })
    if (check.cases.length === 0) return t('verdict.empty', { name })
    return t('verdict.yes', { count: check.cases.length, name })
  }

  function caseMarks(entry: PropertyCase): DigraphMark[] {
    const inR = matrix[entry.need[0]][entry.need[1]]
    const premises = entry.premises.map((pair): DigraphMark => ({ pair, tone: 'now' }))
    if (entry.wantIn) return [...premises, { pair: entry.need, tone: inR ? 'need' : 'missing' }]
    return inR ? [...premises, { pair: entry.need, tone: 'now' }] : premises
  }

  function caseStep(key: PropertyKey, entry: PropertyCase, index: number): BoardStep {
    const [i, j] = entry.need
    const inR = matrix[i][j]
    return {
      row: {
        key: `case${index}`,
        tex: caseTex(key, entry),
        reason: why(entry.need),
        flip: !entry.holds,
        testTex: `${pairOf(entry.need)} ${memberTex(inR)} \\mathrm R`,
        holds: entry.holds,
        visible: true,
        now: false,
      },
      caption: t(`steps.${key}.${entry.holds ? 'holds' : 'fails'}`, {
        premise: entry.premises.map(pairOf).join(',\\ '),
        need: pairOf(entry.need),
        why: why(entry.need),
        a: values[i],
        b: values[j],
      }),
      marks: caseMarks(entry),
      lit: key === 'reflexive' ? [i] : [],
    }
  }

  function verdictStep(key: PropertyKey, rowKey: string): BoardStep {
    const check = checks[key]
    return {
      row: {
        key: rowKey,
        tex: t(`rules.formulas.${key}`),
        reason: verdictText(key),
        flip: !check.holds,
        testTex: check.holds ? '\\checkmark' : '\\times',
        holds: check.holds,
        visible: true,
        now: false,
      },
      caption: verdictText(key),
      marks: check.failure ? caseMarks(check.failure) : [],
      lit: [],
    }
  }

  function propertySteps(key: PropertyKey): BoardStep[] {
    return [...checks[key].cases.map((entry, index) => caseStep(key, entry, index)), verdictStep(key, 'verdict')]
  }

  function equivalenceSteps(): BoardStep[] {
    const failAt = equivalenceParts.findIndex((key) => !checks[key].holds)
    const parts = failAt === -1 ? equivalenceParts : equivalenceParts.slice(0, failAt + 1)
    const steps = parts.map((key) => verdictStep(key, key))
    const classSteps = classes.map(
      (members, index): BoardStep => ({
        row: {
          key: `class${index}`,
          tex: `[${values[members[0]]}] = ${setTex(members.map((member) => values[member]))}`,
          reason: t('reasons.class', { a: values[members[0]] }),
          flip: false,
          testTex: '',
          holds: false,
          visible: true,
          now: false,
        },
        caption: t('steps.class', { a: values[members[0]], set: setTex(members.map((member) => values[member])) }),
        marks: members.flatMap((i) => members.map((j): DigraphMark => ({ pair: [i, j], tone: 'need' }))),
        lit: members,
      }),
    )
    const failed = failAt === -1 ? null : equivalenceParts[failAt]
    const final: BoardStep = {
      row: {
        key: 'final',
        tex: failed ? t('rules.formulas.equivalence') : `A = ${classes.map((members) => `[${values[members[0]]}]`).join(' \\cup ')}`,
        reason: failed ? t('reasons.notEquivalence', { name: t(`names.${failed}`) }) : t('reasons.partition', { count: classes.length }),
        flip: failed !== null,
        testTex: failed ? '\\times' : '\\checkmark',
        holds: failed === null,
        visible: true,
        now: false,
      },
      caption: failed ? t('steps.notEquivalence', { name: t(`names.${failed}`) }) : t('steps.partition', { count: classes.length }),
      marks: failed && checks[failed].failure ? caseMarks(checks[failed].failure) : [],
      lit: [],
    }
    return [...steps, ...classSteps, final]
  }

  const steps = group === 'equivalence' ? equivalenceSteps() : propertySteps(group)
  const total = steps.length
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const reached = (index: number) => current === null || current >= index
  const groupHolds = group === 'equivalence' ? isEquivalence : checks[group].holds
  const idleStep = steps[steps.length - 1]
  const shown = current === null ? idleStep : steps[current]
  const rows = steps.map((step, index) => ({ ...step.row, visible: reached(index), now: current === index }))

  function chooseGroup(next: GroupKey) {
    player.stop()
    setExampleIndex(0)
    setGroup(next)
  }

  function chooseExample(index: number) {
    player.stop()
    setExampleIndex(index)
  }

  function idleReading() {
    if (group !== 'equivalence') return verdictText(group)
    if (!isEquivalence) return idleStep.caption
    const parts = classes.map((members) => setTex(members.map((member) => values[member])))
    return t('reading.classes', { count: classes.length, classes: parts.join(',\\ ') })
  }

  const done = reached(total - 1)
  const stampTone = !done ? 'pending' : groupHolds ? 'yes' : 'flip'

  function propertiesCard() {
    const keys: GroupKey[] = [...propertyKeys, 'equivalence']
    return (
      <TitledCard key="properties" title={t('cards.properties')} wide>
        <table className="w-full border-collapse text-left">
          <tbody>
            {keys.map((key) => {
              const holds = key === 'equivalence' ? isEquivalence : checks[key].holds
              const active = key === group || (group === 'equivalence' && (equivalenceParts as GroupKey[]).includes(key))
              const failure = key === 'equivalence' ? null : checks[key].failure
              return (
                <tr key={key} data-property={key} data-holds={holds} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                  <td className={`${cellClass} font-hand text-[21px] leading-tight font-bold`}>{t(`names.${key}`)}</td>
                  <td className={`${cellClass} text-right`}>
                    <span className={`inline-block px-1.5 font-hand text-[20px] leading-tight font-bold ${holds ? 'bg-highlight dark:text-paper' : 'text-marker'}`}>
                      {t(holds ? 'words.yes' : 'words.no')}
                    </span>
                    {failure && (
                      <span className="mt-0.5 block text-sm text-muted">
                        <MathText text={t('properties.counter', { counter: counterTex(failure) })} />
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className={footnoteClass}>
          <MathText text={t('properties.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function pairsCard() {
    const pairs = relationPairs(matrix)
    const focus = shown.marks.map((mark) => `${mark.pair[0]}-${mark.pair[1]}`)
    return (
      <TitledCard key="pairs" title={t('cards.pairs')}>
        <div data-pairs>
          {pairs.length > 0 ? (
            <SetItemsList
              head="\mathrm R = \{"
              items={pairs.map((pair) => ({ key: `${pair[0]}-${pair[1]}`, tex: pairOf(pair), lit: focus.includes(`${pair[0]}-${pair[1]}`) }))}
            />
          ) : (
            <p>
              <MathTex tex="\mathrm R = \varnothing" />
            </p>
          )}
        </div>
        <p className={footnoteClass}>
          <MathText text={t('pairsCard.count', { count: pairs.length, size: values.length * values.length, set: setTex(values) })} />
        </p>
      </TitledCard>
    )
  }

  function pictureCard() {
    return (
      <TitledCard key="picture" title={t('cards.picture')}>
        <div className="grid gap-3.5">
          {(['graph', 'grid'] as const).map((view) => (
            <p key={view} data-picture={view}>
              <span className="block font-hand text-[21px] leading-tight font-bold">{t(`picture.${view}`)}</span>
              <span className="mt-1 block text-[15px] text-muted">
                <MathText text={t(`picture.${group}.${view}`)} />
              </span>
            </p>
          ))}
        </div>
      </TitledCard>
    )
  }

  function classesCard() {
    return (
      <TitledCard key="classes" title={t('cards.classes')} wide>
        {isEquivalence ? (
          <div data-classes={classes.length} className="grid gap-1.5">
            {classes.map((members) => {
              const names = members.map((member) => `[${values[member]}]`).join(' = ')
              return (
                <p key={members.join('-')} data-class={members.map((member) => values[member]).join(',')}>
                  <MathTex tex={`${names} = ${setTex(members.map((member) => values[member]))}`} />
                </p>
              )
            })}
          </div>
        ) : (
          <p data-classes="0">
            <MathText text={t('classesCard.none')} />
          </p>
        )}
        <p className={footnoteClass}>
          <MathText text={t('classesCard.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function rulesCard() {
    return (
      <TitledCard key="rules" title={t('cards.rules')} wide>
        <table className="w-full border-collapse text-left">
          <tbody>
            {formulaKeys.map((key) => {
              const active = key === group || (group === 'equivalence' && key === 'class')
              return (
                <tr key={key} data-rule={key} data-active={active || undefined} className={active ? 'bg-highlight-soft' : ''}>
                  <td className={cellClass}>
                    <MathTex tex={t(`rules.formulas.${key}`)} />
                    <span className="block text-sm text-muted">
                      <MathText text={t(`rules.names.${key}`)} />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className={footnoteClass}>
          <MathText text={t('rules.footnote')} />
        </p>
      </TitledCard>
    )
  }

  const cards: ReactNode[] = [propertiesCard(), pairsCard(), pictureCard()]
  if (group === 'equivalence') cards.push(classesCard())
  cards.push(rulesCard())

  const legendIcons: Record<LegendKey, ReactNode> = {
    arrow: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={1.6} className="stroke-ink" />
        <path d="M40 11 L30.7 7.3 L30.7 14.7 Z" className="fill-ink" />
      </>
    ),
    loop: (
      <>
        <path d="M18.5 12 C12 4 17 0 22 0 C27 0 32 4 25.5 12" strokeWidth={1.5} className="fill-none stroke-ink" />
        <circle cx={22} cy={15} r={6} strokeWidth={1.5} className="fill-paper stroke-ink" />
      </>
    ),
    cell: (
      <>
        <circle cx={22} cy={11} r={9} className="fill-highlight" />
        <circle cx={22} cy={11} r={4.5} className="fill-ink" />
      </>
    ),
    diagonal: <line x1={6} x2={38} y1={19} y2={3} strokeWidth={1.4} strokeDasharray="8 5" className="stroke-muted" />,
    now: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={2.2} strokeDasharray="6 4" className="stroke-marker" />
        <path d="M40 11 L30.7 7.3 L30.7 14.7 Z" className="fill-marker" />
      </>
    ),
    need: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={2.8} className="stroke-ink" />
        <path d="M40 11 L30.7 7.3 L30.7 14.7 Z" className="fill-ink" />
      </>
    ),
    missing: (
      <>
        <line x1={4} x2={33} y1={11} y2={11} strokeWidth={2} strokeDasharray="3 4" className="stroke-marker" />
        <path d="M40 11 L30.7 7.3 L30.7 14.7 Z" strokeWidth={1.4} className="fill-none stroke-marker" />
      </>
    ),
  }

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup options={groupKeys.map((key) => ({ value: key, label: t(`groups.${key}`) }))} value={group} onChange={chooseGroup} />
          <PenSelect
            label={tPlayback('delay')}
            options={delays.map((seconds) => ({ value: seconds, label: tPlayback('seconds', { value: seconds }) }))}
            value={delay}
            onChange={setDelay}
          />
          <PlayButton playing={player.playing} startLabel={tPlayback('start')} stopLabel={tPlayback('stop')} onClick={() => (player.playing ? player.stop() : player.start())} />
          <div data-examples className="flex min-h-10 basis-full flex-wrap items-baseline gap-x-6.5 gap-y-3">
            {groupSamples[group].map((key, index) => (
              <TabButton key={key} data-example={key} active={index === exampleIndex} onClick={() => chooseExample(index)}>
                <MathText text={t(`chips.${key}`)} />
              </TabButton>
            ))}
          </div>
        </>
      }
      board={
        <TitledCard title={t(`groups.${group}`)}>
          <div data-equation className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-[17px]">
              <MathText text={t(`statements.${sampleKey}`)} />
            </span>
            <Stamp tone={stampTone}>{t(`stamps.${group}.${!done || groupHolds ? 'yes' : 'no'}`)}</Stamp>
          </div>
          <RelationDigraphBoard
            name="A"
            labels={values.map(String)}
            matrix={matrix}
            marks={shown.marks}
            litNodes={shown.lit}
            ariaLabel={t('aria.board')}
          />
          <div className="mt-3">
            <InequalityStepsTable rows={rows} stepHeader={t('table.step')} testHeader="" verdicts={null} markTest />
          </div>
          <p data-reading className="mt-2.5 min-h-[1.6em] text-[17px] [&_.katex]:text-[1.15em]!">
            <MathText text={current === null ? idleReading() : shown.caption} />
          </p>
        </TitledCard>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={current !== null && <MathText text={shown.caption} />}
          idleText={t('idle')}
        />
      }
      stage={<div className="grid gap-6 sm:grid-cols-2">{cards}</div>}
      detail={
        <NoteCard>
          <p className="mb-3.5">
            <MathText text={t(`intros.${group}`)} />
          </p>
          <p className="text-muted">
            <MathText text={t(`tips.${group}`)} />
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-t border-dashed border-faint pt-3">
            {legendKeys.map((key) => (
              <div key={key} className="contents">
                <dt>
                  <svg viewBox="0 0 44 22" className="block h-5.5 w-11">
                    {legendIcons[key]}
                  </svg>
                </dt>
                <dd className="text-muted">
                  <MathText text={t(`legend.${key}`)} />
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
