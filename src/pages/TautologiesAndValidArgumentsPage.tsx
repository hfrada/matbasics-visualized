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
import { TitledCard } from '../components/molecules/TitledCard'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { ExpressionTree } from '../components/organisms/ExpressionTree'
import { LayeredTableBoard, type LayeredColumn } from '../components/organisms/LayeredTableBoard'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicPager } from '../components/organisms/TopicPager'
import { LabTemplate } from '../components/templates/LabTemplate'
import { useStepPlayer } from '../hooks/useStepPlayer'
import { useToolbar } from '../hooks/useToolbar'
import { useTopicNavigation } from '../hooks/useTopicNavigation'
import {
  conjunction,
  connectiveGlyph,
  connectiveTex,
  disjunction,
  evaluate,
  expressionTex,
  implication,
  letter,
  letterCountOf,
  lettersOf,
  levelOrder,
  negation,
  partsOf,
  truthRows,
  type LogicExpression,
  type TruthAssignment,
} from '../lib/logicExpression'

type ModeKey = 'tautology' | 'argument'
type FormulaKey =
  | 'implicationOrP'
  | 'pImpliesDisjunction'
  | 'rainAndNoRain'
  | 'modusPonensAndNotP'
  | 'notPImpliesConjunction'
type ArgumentKey = 'modusPonens' | 'modusTollens' | 'syllogism' | 'contrapositive' | 'meaningfulNotValid'
type Kind = 'tautology' | 'contradiction' | 'neither'

type ArgumentForm = {
  premises: LogicExpression[]
  conclusion: LogicExpression
}

type SheetColumn = {
  key: string
  expression: LogicExpression
  tex: string
  step: number
  final: boolean
}

type SheetRole = {
  expression: LogicExpression
  tex: string
  premise: number | null
}

type Sheet = {
  expression: LogicExpression
  letters: string[]
  rows: TruthAssignment[]
  columns: SheetColumn[]
  finals: boolean[]
  kind: Kind
  roles: SheetRole[]
}

const P = letter('P')
const Q = letter('Q')
const R = letter('R')

const modeKeys: ModeKey[] = ['tautology', 'argument']
const formulaKeys: FormulaKey[] = [
  'implicationOrP',
  'pImpliesDisjunction',
  'rainAndNoRain',
  'modusPonensAndNotP',
  'notPImpliesConjunction',
]
const argumentKeys: ArgumentKey[] = ['modusPonens', 'modusTollens', 'syllogism', 'contrapositive', 'meaningfulNotValid']
const kinds: Kind[] = ['tautology', 'contradiction', 'neither']
const delays = [0.5, 1, 1.5, 2, 3]

const formulas: Record<FormulaKey, LogicExpression> = {
  implicationOrP: disjunction(implication(P, Q), P),
  pImpliesDisjunction: implication(P, disjunction(P, Q)),
  rainAndNoRain: conjunction(P, negation(P)),
  modusPonensAndNotP: conjunction(conjunction(implication(P, Q), P), negation(P)),
  notPImpliesConjunction: implication(negation(P), conjunction(P, Q)),
}

const argumentForms: Record<ArgumentKey, ArgumentForm> = {
  modusPonens: { premises: [implication(P, Q), P], conclusion: Q },
  modusTollens: { premises: [implication(P, Q), negation(Q)], conclusion: negation(P) },
  syllogism: { premises: [implication(P, Q), implication(Q, R)], conclusion: implication(P, R) },
  contrapositive: { premises: [implication(P, Q)], conclusion: implication(negation(Q), negation(P)) },
  meaningfulNotValid: { premises: [implication(P, Q), negation(P)], conclusion: negation(Q) },
}

function argumentExpression(form: ArgumentForm): LogicExpression {
  const joined = form.premises.reduce((left, right) => conjunction(left, right))
  return implication(joined, form.conclusion)
}

function kindOf(finals: boolean[]): Kind {
  if (finals.every((value) => value)) return 'tautology'
  if (finals.every((value) => !value)) return 'contradiction'
  return 'neither'
}

function rolesOf(form: ArgumentForm): SheetRole[] {
  return [
    ...form.premises.map((expression, index) => ({ expression, tex: expressionTex(expression), premise: index })),
    { expression: form.conclusion, tex: expressionTex(form.conclusion), premise: null },
  ]
}

function sheetOf(expression: LogicExpression, roles: SheetRole[]): Sheet {
  const letters = lettersOf([expression])
  const rows = truthRows(letters)
  const order = levelOrder(expression)
  const columns = order.map((item, index) => {
    const tex = expressionTex(item)
    return { key: tex, expression: item, tex, step: index, final: index === order.length - 1 }
  })
  const finals = rows.map((values) => evaluate(expression, values))
  return { expression, letters, rows, columns, finals, kind: kindOf(finals), roles }
}

const formulaSheets = Object.fromEntries(formulaKeys.map((key) => [key, sheetOf(formulas[key], [])])) as Record<
  FormulaKey,
  Sheet
>

const argumentSheets = Object.fromEntries(
  argumentKeys.map((key) => [key, sheetOf(argumentExpression(argumentForms[key]), rolesOf(argumentForms[key]))]),
) as Record<ArgumentKey, Sheet>

function headerLines(expression: LogicExpression) {
  if (expression.kind === 'letter' || expression.kind === 'not' || letterCountOf(expression) < 4) return undefined
  return [expressionTex(expression.left, true), `${connectiveTex[expression.kind]} ${expressionTex(expression.right, true)}`]
}

function StrongText({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, index) =>
        index % 2 === 1 ? <strong key={index}>{part}</strong> : <MathText key={index} text={part} />,
      )}
    </>
  )
}

const cellClass = 'border-t border-dashed border-faint py-3.5 align-top text-[15px] transition-opacity duration-300'
const headClass = 'pb-3 font-hand text-[21px] leading-tight font-bold'
const stepNumberClass = 'font-hand text-[22px] leading-[1.4] font-bold'
const labelClass = 'font-hand text-[21px] leading-none text-muted'
const chipClass =
  'relative inline-block min-w-6.5 rounded-[3px] px-1.5 text-center font-hand text-[22px] leading-[1.3] font-bold'
const ringClass = 'pointer-events-none absolute -inset-x-0.5 -inset-y-1 rounded-full border-2 border-marker'
const stampClass =
  'inline-block rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 px-3 pt-1 pb-1.5 font-hand text-2xl leading-none font-bold whitespace-nowrap'
const kindTone: Record<Kind, string> = {
  tautology: 'border-ink bg-highlight dark:text-paper',
  contradiction: 'border-marker text-marker',
  neither: 'border-muted text-muted',
}
const sentenceClass = 'mt-1.5 border-t-[1.5px] border-ink pt-1.5 font-semibold'

export function TautologiesAndValidArgumentsPage() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'topics.tautologiesAndValidArguments' })
  const { t: tPlayback } = useTranslation('translation', { keyPrefix: 'playback' })
  const { t: tRoot } = useTranslation()
  const toolbar = useToolbar()
  const navigation = useTopicNavigation('tautologiesAndValidArguments')
  const [mode, setMode] = useState<ModeKey>('tautology')
  const [formulaTab, setFormulaTab] = useState<FormulaKey>('implicationOrP')
  const [argumentTab, setArgumentTab] = useState<ArgumentKey>('modusPonens')
  const [selection, setSelection] = useState<number | null>(null)
  const [delay, setDelay] = useState(1)

  const sheet = mode === 'tautology' ? formulaSheets[formulaTab] : argumentSheets[argumentTab]
  const total = sheet.columns.length + 1
  const player = useStepPlayer({ steps: total, delayMs: delay * 1000, travelMs: 0 })
  const current = player.target
  const checking = current === sheet.columns.length
  const verdictShown = current === null || checking
  const picked = current === null ? selection : null
  const now = sheet.columns.find((column) => column.step === current) ?? null
  const sheetTex = expressionTex(sheet.expression)
  const premises = sheet.roles.filter((role) => role.premise !== null)
  const conclusion = sheet.roles.find((role) => role.premise === null)
  const valid = sheet.kind === 'tautology'
  const feeding = new Set(
    now
      ? partsOf(now.expression).map((part) => (part.kind === 'letter' ? `letter:${part.name}` : expressionTex(part)))
      : [],
  )

  const truth = (value: boolean) => tRoot(value ? 'truthValues.true' : 'truthValues.false')
  const list = (items: string[]) => new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(items)
  const rowsWith = (value: boolean) => sheet.finals.flatMap((final, row) => (final === value ? [String(row + 1)] : []))
  const premisesTrue = (values: TruthAssignment) => premises.every((role) => evaluate(role.expression, values))
  const flagged = (row: number) => checking && sheet.kind === 'neither' && !sheet.finals[row]
  const stepOf = (expression: LogicExpression) =>
    sheet.columns.find((column) => column.tex === expressionTex(expression))?.step ?? 0

  function roleName(role: SheetRole) {
    if (role.premise === null) return t('roles.conclusion')
    return premises.length > 1 ? t('roles.numbered', { number: role.premise + 1 }) : t('roles.single')
  }

  function tableRole(tex: string) {
    const role = sheet.roles.find((item) => item.tex === tex)
    if (!role) return undefined
    return role.premise === null ? t('roles.therefore') : roleName(role)
  }

  function chooseMode(next: ModeKey) {
    player.stop()
    setSelection(null)
    setMode(next)
  }

  function chooseFormula(next: FormulaKey) {
    player.stop()
    setSelection(null)
    setFormulaTab(next)
  }

  function chooseArgument(next: ArgumentKey) {
    player.stop()
    setSelection(null)
    setArgumentTab(next)
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

  function verdict() {
    if (mode === 'argument') {
      return valid
        ? t('verdict.valid', { value: truth(true) })
        : t('verdict.invalid', { rows: list(rowsWith(false)), value: truth(false) })
    }
    const kind = sheet.kind
    if (kind === 'neither') {
      return t('verdict.neither', {
        falseRows: list(rowsWith(false)),
        falseValue: truth(false),
        trueRows: list(rowsWith(true)),
        trueValue: truth(true),
      })
    }
    return t(`verdict.${kind}`, { value: truth(kind === 'tautology'), expression: sheetTex })
  }

  function caption(step: number) {
    if (step === sheet.columns.length) return verdict()
    const column = sheet.columns[step]
    const connective = column.expression.kind
    if (connective === 'letter' || connective === 'iff') return ''
    return t('caption', {
      step: step + 1,
      expression: column.tex,
      sources: list(partsOf(column.expression).map((part) => `$${expressionTex(part)}$`)),
      connective: connectiveTex[connective],
      rule: t(`rules.${connective}`),
      values: sheet.rows.map((values) => truth(evaluate(column.expression, values))).join(' '),
    })
  }

  function chip(value: boolean, ringed = false) {
    return (
      <span className={`${chipClass} ${value ? '' : 'text-marker'}`}>
        {truth(value)}
        {ringed && <span aria-hidden="true" className={ringClass} />}
      </span>
    )
  }

  function stamp() {
    if (!verdictShown) {
      return (
        <span data-verdict="pending" className={`${stampClass} border-dashed border-faint text-faint`}>
          ?
        </span>
      )
    }
    if (mode === 'argument') {
      return (
        <span data-verdict={valid ? 'valid' : 'invalid'} className={`${stampClass} ${kindTone[valid ? 'tautology' : 'contradiction']}`}>
          {t(valid ? 'validity.valid' : 'validity.invalid')}
        </span>
      )
    }
    return (
      <span data-verdict={sheet.kind} className={`${stampClass} ${kindTone[sheet.kind]}`}>
        {t(`kinds.${sheet.kind}`)}
      </span>
    )
  }

  const tableColumns: LayeredColumn[] = sheet.columns.map((column, index) => ({
    key: column.key,
    tex: column.tex,
    lines: headerLines(column.expression),
    role: tableRole(column.tex),
    step: column.step,
    final: column.final,
    split: index === 0,
    filled: current === null || column.step <= current,
    feeds: feeding.has(column.key),
    now: column === now,
    highlighted: column === now || (checking && column.final),
  }))

  const table = (
    <div className="relative overflow-x-auto overflow-y-hidden">
      <LayeredTableBoard
        letters={sheet.letters.map((name) => ({ tex: name, feeds: feeding.has(`letter:${name}`), role: tableRole(name) }))}
        columns={tableColumns}
        groups={null}
        rows={sheet.rows.map((values, row) => ({
          letters: sheet.letters.map((name) => values[name]),
          cells: sheet.columns.map((column) => evaluate(column.expression, values)),
          same: true,
          flagged: flagged(row),
        }))}
        sameHead={null}
        sameShown={false}
        comparing={false}
        rowHead={t('rowHead')}
        stepHead={t('stepHead')}
        active={picked}
        picked={picked}
        interactive={!player.playing}
        truthLabel={truth}
        rowLabel={(row) => t('rowLabel', { row: row + 1 })}
        onPick={select}
        compact={mode === 'argument'}
      />
    </div>
  )

  function exampleTabs() {
    if (mode === 'tautology') {
      return (
        <TabGroup
          options={formulaKeys.map((key) => ({
            value: key,
            label: <MathTex tex={expressionTex(formulas[key])} className="text-[0.8em]" />,
          }))}
          value={formulaTab}
          onChange={chooseFormula}
        />
      )
    }
    return (
      <TabGroup
        options={argumentKeys.map((key) => ({ value: key, label: t(`arguments.${key}.label`) }))}
        value={argumentTab}
        onChange={chooseArgument}
      />
    )
  }

  function tautologyBoard() {
    const rain = formulaTab === 'rainAndNoRain'
    return (
      <>
        {rain && (
          <>
            <div className="mt-3 grid grid-cols-[auto_1fr] items-baseline gap-x-4">
              <span className={labelClass}>{t('suppose')}</span>
              <p>
                <MathText text={t('rain.letter')} />
              </p>
            </div>
            <p className="mt-3">
              <MathText text={t('rain.reading')} />
            </p>
          </>
        )}
        <div className={`${rain ? 'mt-4.5' : 'mt-1.5'} mb-5.5 flex justify-center`}>
          <ExpressionTree
            expression={sheet.expression}
            stepOf={stepOf}
            current={current}
            comparing={checking}
            values={picked === null ? null : sheet.rows[picked]}
            truthLabel={truth}
            label={t('treeLabel')}
          />
        </div>
        {table}
      </>
    )
  }

  function argumentBoard() {
    if (!conclusion) return null
    const names = t(`arguments.${argumentTab}.letters`, { returnObjects: true })
    const sentences = t(`arguments.${argumentTab}.premises`, { returnObjects: true })
    const values = picked === null ? null : sheet.rows[picked]
    const braced = premises.map(
      (role) => `\\underbrace{${expressionTex(role.expression, true)}}_{\\text{${roleName(role)}}}`,
    )
    const left = braced.length > 1 ? `[${braced.join(' \\wedge ')}]` : braced[0]
    const formula = `${left} \\Rightarrow \\underbrace{${expressionTex(conclusion.expression, true)}}_{\\text{${t('roles.conclusion')}}}`
    return (
      <>
        <div className="mt-3 grid grid-cols-[auto_1fr] items-baseline gap-x-4">
          <span className={labelClass}>{t('suppose')}</span>
          <div className="grid gap-1.5">
            {sheet.letters.map((name, index) => (
              <p key={name}>
                <MathText text={`$${name}$: ${names[index][0]}`} />
              </p>
            ))}
          </div>
        </div>
        <div className="mt-4.5 grid grid-cols-[auto_minmax(0,1fr)_auto_2.5rem] items-baseline gap-x-4">
          {sheet.roles.map((role) => {
            const value = values ? evaluate(role.expression, values) : null
            const lineClass = role.premise === null ? 'border-t-[1.5px] border-ink pt-2.75 pb-2.25' : 'py-2.25'
            return (
              <div key={`${role.premise}:${role.tex}`} data-argument-line={role.premise === null ? 'conclusion' : 'premise'} className="contents">
                <span className={`${labelClass} whitespace-nowrap ${lineClass}`}>
                  {role.premise === null ? t('roles.thereforeLine') : roleName(role)}
                </span>
                <span className={`${lineClass} ${role.premise === null ? 'font-semibold' : ''}`}>
                  {role.premise === null ? t(`arguments.${argumentTab}.conclusion`) : sentences[role.premise]}
                </span>
                <span className={`${lineClass} whitespace-nowrap`}>
                  <MathTex tex={role.tex} />
                </span>
                <span className={`${lineClass} text-center`}>
                  {value !== null && (
                    <span
                      data-line-value={String(value)}
                      className={`${chipClass} min-w-8.5 ${value ? 'bg-highlight dark:text-paper' : 'text-marker'}`}
                    >
                      {truth(value)}
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <span className={labelClass}>{t('asImplication')}</span>
          <MathTex tex={formula} className="block max-w-full min-w-0 overflow-x-auto overflow-y-hidden px-1 py-1 text-[1.15em]" />
        </div>
        {table}
      </>
    )
  }

  function tautologyDefinitionCard() {
    return (
      <TitledCard title={t('cards.definition')}>
        {(['tautology', 'contradiction'] as const).map((key) => (
          <p
            key={key}
            data-definition={key}
            data-lit={sheet.kind === key || undefined}
            className={`-mx-3 rounded-[3px] px-3 py-2 transition-opacity duration-300 ${key === 'contradiction' ? 'mt-1.5' : ''} ${sheet.kind === key ? 'bg-highlight-soft' : 'opacity-50'}`}
          >
            <StrongText text={t(`definition.${key}`)} />
          </p>
        ))}
        {sheet.kind === 'neither' && (
          <p className="mt-4.5 text-[15px] text-muted">
            <MathText text={t('definition.neither', { expression: sheetTex })} />
          </p>
        )}
      </TitledCard>
    )
  }

  function kindCard() {
    return (
      <TitledCard title={t('cards.kinds')}>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={`${headClass} pr-4 pl-2`}>{t('kindTable.column')}</th>
                <th className={`${headClass} pr-2`}>{t('kindTable.name')}</th>
              </tr>
            </thead>
            <tbody>
              {kinds.map((key) => {
                const tone = key === sheet.kind ? 'bg-highlight-soft' : ''
                return (
                  <tr key={key} data-kind={key} data-lit={tone ? true : undefined}>
                    <th className={`${cellClass} ${tone} pr-4 pl-2 font-normal whitespace-nowrap`}>{t(`kindTable.${key}`)}</th>
                    <td className={`${cellClass} ${tone} pr-2`}>{t(`kinds.${key}`)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('kindTable.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function finalsCard() {
    return (
      <TitledCard title={t('cards.finals')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={`${headClass} pr-4 pl-2`}>{t('finals.proposition')}</th>
                <th className={`${headClass} px-2 text-center`}>{t('finals.values')}</th>
                <th className={`${headClass} pr-2`}>{t('finals.name')}</th>
              </tr>
            </thead>
            <tbody>
              {formulaKeys.map((key) => {
                const item = formulaSheets[key]
                const tone = key === formulaTab ? 'bg-highlight-soft' : ''
                return (
                  <tr key={key} data-formula={key} data-lit={tone ? true : undefined}>
                    <th className={`${cellClass} ${tone} pr-4 pl-2 font-normal whitespace-nowrap`}>
                      <MathTex tex={expressionTex(item.expression)} />
                    </th>
                    <td className={`${cellClass} ${tone} ${stepNumberClass} px-2 text-center whitespace-nowrap`}>
                      {item.finals.map((value, row) => (
                        <span key={row} className={value ? '' : 'text-marker'}>
                          {truth(value)}
                        </span>
                      ))}
                    </td>
                    <td className={`${cellClass} ${tone} pr-2`}>{t(`kinds.${item.kind}`)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">{t('finals.footnote')}</p>
      </TitledCard>
    )
  }

  function argumentCard() {
    return (
      <TitledCard title={t('cards.argument')}>
        <p>
          <StrongText text={t('argument.terms')} />
        </p>
        <p className="-mx-3 mt-3 rounded-[3px] bg-highlight-soft px-3 py-2">
          <StrongText text={t('argument.valid')} />
        </p>
        <p className="mt-4.5 text-[15px] text-muted">
          <MathText text={t('argument.footnote')} />
        </p>
      </TitledCard>
    )
  }

  function meaningCard() {
    const items = t('meaning.items', { returnObjects: true })
    return (
      <TitledCard title={t('cards.meaning')}>
        <div className="grid gap-5.5">
          {items.map((item) => (
            <div key={item.tag} data-meaning={item.tag}>
              <span className={`${labelClass} mb-1.5 block text-xl`}>{item.tag}</span>
              {item.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className={sentenceClass}>∴ {item.conclusion}</p>
              <p className="mt-2 text-[15px] text-muted">{item.remark}</p>
            </div>
          ))}
        </div>
        <p className="mt-4.5 text-[15px] text-muted">{t('meaning.footnote')}</p>
      </TitledCard>
    )
  }

  function samplesCard() {
    if (argumentTab === 'meaningfulNotValid') return meaningCard()
    const samples = t(`samples.${argumentTab}`, { returnObjects: true })
    return (
      <TitledCard title={t('cards.samples', { name: t(`arguments.${argumentTab}.label`) })}>
        <div className="grid gap-5.5">
          {samples.map((sample) => (
            <div key={sample.tag} data-sample={sample.tag}>
              <span className={`${labelClass} mb-1.5 block text-xl`}>{sample.tag}</span>
              {sample.lines.map((line) => (
                <p key={line}>
                  <MathText text={line} />
                </p>
              ))}
              <p className={sentenceClass}>
                ∴ <MathText text={sample.conclusion} />
              </p>
            </div>
          ))}
        </div>
      </TitledCard>
    )
  }

  function criticalCard() {
    if (!conclusion) return null
    const roleHead = (role: SheetRole) => (
      <th key={`${role.premise}:${role.tex}`} className={`${headClass} px-2 text-center`}>
        {roleName(role)}
        <span className="mt-1 block font-sans text-[15px] font-normal whitespace-nowrap text-muted">
          <MathTex tex={role.tex} />
        </span>
      </th>
    )
    return (
      <TitledCard title={t('cards.critical')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={`${headClass} px-2 text-center align-top`}>{t('critical.row')}</th>
                {sheet.roles.map(roleHead)}
                <th className={`${headClass} pr-2 align-top`}>{t('critical.meaning')}</th>
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((values, row) => {
                const allTrue = premisesTrue(values)
                const result = evaluate(conclusion.expression, values)
                const counter = allTrue && !result
                const tone =
                  row === picked ? 'bg-highlight-soft' : counter ? 'bg-marker/8' : allTrue ? 'bg-highlight-soft' : 'opacity-50'
                return (
                  <tr key={row} data-critical={allTrue} data-counter={counter}>
                    <td className={`${cellClass} ${tone} ${stepNumberClass} px-2 text-center`}>{row + 1}</td>
                    {premises.map((role) => (
                      <td key={`${role.premise}:${role.tex}`} className={`${cellClass} ${tone} px-2 text-center`}>
                        {chip(evaluate(role.expression, values))}
                      </td>
                    ))}
                    <td className={`${cellClass} ${tone} px-2 text-center`}>{chip(result, counter)}</td>
                    <td className={`${cellClass} ${tone} pr-2 ${counter ? 'text-marker' : ''}`}>
                      {t(counter ? 'critical.counter' : allTrue ? 'critical.tested' : 'critical.untested')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">{t('critical.footnote')}</p>
      </TitledCard>
    )
  }

  function summaryCard() {
    return (
      <TitledCard title={t('cards.summary')} wide>
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={`${headClass} pr-4 pl-2`}>{t('summary.name')}</th>
                <th className={`${headClass} pr-4`}>{t('summary.implication')}</th>
                <th className={`${headClass} pr-2`}>{t('summary.argument')}</th>
              </tr>
            </thead>
            <tbody>
              {argumentKeys.map((key) => {
                const form = argumentForms[key]
                const item = argumentSheets[key]
                const isValid = item.kind === 'tautology'
                const tone = key === argumentTab ? 'bg-highlight-soft' : ''
                return (
                  <tr key={key} data-summary={key} data-valid={isValid} data-lit={tone ? true : undefined}>
                    <th className={`${cellClass} ${tone} pr-4 pl-2 font-normal whitespace-nowrap ${isValid ? '' : 'text-marker'}`}>
                      {isValid ? t(`arguments.${key}.label`) : t('summary.invalid')}
                    </th>
                    <td className={`${cellClass} ${tone} pr-4 whitespace-nowrap ${isValid ? '' : 'text-marker'}`}>
                      <MathTex tex={expressionTex(item.expression)} />
                    </td>
                    <td className={`${cellClass} ${tone} pr-2 whitespace-nowrap`}>
                      {form.premises.map((premise) => (
                        <p key={expressionTex(premise)}>
                          <MathTex tex={expressionTex(premise)} />
                        </p>
                      ))}
                      <p>
                        <MathTex tex={`\\therefore ${expressionTex(form.conclusion)}`} />
                      </p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4.5 text-[15px] text-muted">{t('summary.footnote')}</p>
      </TitledCard>
    )
  }

  function note() {
    if (picked !== null) {
      const values = sheet.rows[picked]
      const heading = (
        <p className="mb-3">
          <strong>{t('rowLabel', { row: picked + 1 })}</strong>{' '}
          <MathText text={`${sheet.letters.map((name) => `$${name}$ = ${truth(values[name])}`).join(', ')}.`} />
        </p>
      )
      if (mode === 'argument' && conclusion) {
        const names = t(`arguments.${argumentTab}.letters`, { returnObjects: true })
        const situation = sheet.letters.map((name, index) => names[index][values[name] ? 0 : 1]).join(', ')
        const allTrue = premisesTrue(values)
        const result = evaluate(conclusion.expression, values)
        return (
          <>
            {heading}
            <p className="mb-3">{t('reading.situation', { situation })}</p>
            <ul className="mb-3.5 grid gap-1.5">
              {sheet.roles.map((role) => (
                <li key={`${role.premise}:${role.tex}`}>
                  <MathText
                    text={t('reading.role', {
                      role: roleName(role),
                      expression: role.tex,
                      value: truth(evaluate(role.expression, values)),
                    })}
                  />
                </li>
              ))}
            </ul>
            <p data-reading={!allTrue ? 'untested' : result ? 'tested' : 'counter'} className={allTrue && !result ? 'text-marker' : ''}>
              {!allTrue ? t('reading.untested', { value: truth(true) }) : result ? t('reading.tested') : t('reading.counter')}
            </p>
          </>
        )
      }
      return (
        <>
          {heading}
          <ol className="mb-3.5 grid gap-1.5">
            {sheet.columns.map((column) => (
              <li key={column.key} className="flex items-baseline gap-2.5">
                <span className="min-w-4.5 font-bold text-muted">{column.step + 1}</span>
                <span>
                  <MathTex tex={column.tex} className="text-[0.8em]" /> = {truth(evaluate(column.expression, values))}
                </span>
              </li>
            ))}
          </ol>
          <p>
            <MathText text={t('reading.result', { expression: sheetTex, value: truth(sheet.finals[picked]) })} />
          </p>
        </>
      )
    }
    const intro =
      mode === 'tautology'
        ? `${t('intro.tautology')} ${t(`formulas.${formulaTab}`)}`
        : `${t('intro.argument')} ${t(`arguments.${argumentTab}.intro`)}`
    return (
      <>
        <p className="mb-3.5">
          <MathText text={intro} />
        </p>
        <p className="text-muted">{t(`hint.${mode}`)}</p>
      </>
    )
  }

  const swatchClass = 'relative flex h-6 w-8.5 items-center justify-center font-hand text-xl font-bold'
  const roleSwatchClass = 'flex justify-center font-hand text-[19px] leading-none whitespace-nowrap text-muted'

  return (
    <LabTemplate
      breadcrumb={<Breadcrumb {...navigation.breadcrumb} />}
      toolbar={<Toolbar {...toolbar} />}
      title={<Title size="md">{t('title')}</Title>}
      controls={
        <>
          <TabGroup
            options={modeKeys.map((key) => ({ value: key, label: t(`modes.${key}`) }))}
            value={mode}
            onChange={chooseMode}
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
          <div className="basis-full">{exampleTabs()}</div>
        </>
      }
      board={
        <TitledCard
          title={
            <span className="flex flex-wrap items-center gap-x-4.5 gap-y-2">
              <span>
                {mode === 'tautology' ? (
                  <MathText text={t('board', { expression: sheetTex })} />
                ) : (
                  t(`arguments.${argumentTab}.title`)
                )}
              </span>
              {stamp()}
            </span>
          }
        >
          {mode === 'tautology' ? tautologyBoard() : argumentBoard()}
        </TitledCard>
      }
      progress={
        <StepProgress
          total={total}
          current={current}
          caption={current !== null && <MathText text={caption(current)} />}
          idleText={tPlayback('idle')}
        />
      }
      stage={
        <div className="grid gap-6 sm:grid-cols-2">
          {mode === 'tautology' ? (
            <>
              {tautologyDefinitionCard()}
              {kindCard()}
              {finalsCard()}
            </>
          ) : (
            <>
              {argumentCard()}
              {samplesCard()}
              {criticalCard()}
              {summaryCard()}
            </>
          )}
        </div>
      }
      detail={
        <NoteCard>
          {note()}
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 border-t border-dashed border-faint pt-3">
            <div className="contents">
              <dt className={`${swatchClass} bg-highlight dark:text-paper`}>{truth(true)}</dt>
              <dd className="text-muted">{t('legend.true')}</dd>
            </div>
            <div className="contents">
              <dt className={`${swatchClass} text-marker`}>{truth(false)}</dt>
              <dd className="text-muted">{t('legend.false')}</dd>
            </div>
            <div className="contents">
              <dt className={`${swatchClass} text-muted`}>2</dt>
              <dd className="text-muted">{t('legend.step')}</dd>
            </div>
            <div className="contents">
              <dt className={`${swatchClass} bg-highlight-soft font-normal`}>{truth(true)}</dt>
              <dd className="text-muted">{t('legend.feeds')}</dd>
            </div>
            <div className="contents">
              <dt className={`${swatchClass} text-marker`}>
                {truth(false)}
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-1 -inset-y-0.5 rounded-full border-2 border-marker" />
              </dt>
              <dd className="text-muted">{t(mode === 'argument' ? 'legend.ringArgument' : 'legend.ringTautology')}</dd>
            </div>
            {mode === 'tautology' ? (
              <div className="contents">
                <dt className="flex w-8.5 justify-center">
                  <span className="flex size-7 items-center justify-center rounded-full border-2 border-ink bg-highlight font-math text-base dark:text-paper">
                    {connectiveGlyph.and}
                  </span>
                </dt>
                <dd className="text-muted">{t('legend.treeTrue')}</dd>
              </div>
            ) : (
              <>
                <div className="contents">
                  <dt className={roleSwatchClass}>{t('roles.numbered', { number: 1 })}</dt>
                  <dd className="text-muted">{t('legend.role')}</dd>
                </div>
                <div className="contents">
                  <dt className={roleSwatchClass}>{t('roles.therefore')}</dt>
                  <dd className="text-muted">{t('legend.therefore')}</dd>
                </div>
              </>
            )}
          </dl>
        </NoteCard>
      }
      pager={<TopicPager {...navigation.pager} />}
    />
  )
}
