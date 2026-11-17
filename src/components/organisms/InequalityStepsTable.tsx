import type { ReactNode } from 'react'
import { MathTex } from '../atoms/MathTex'
import { MathText } from '../atoms/MathText'

export type StepTableRow = {
  key: string
  tex: string
  reason: string | null
  flip: boolean
  testTex: string
  holds: boolean
  visible: boolean
  now: boolean
}

type InequalityStepsTableProps = {
  rows: StepTableRow[]
  stepHeader: string
  testHeader: ReactNode
  verdicts: { holds: string; fails: string } | null
  markTest?: boolean
}

const cellClass = 'border-t border-dashed border-faint py-2.25 pr-3 align-middle'

export function InequalityStepsTable({ rows, stepHeader, testHeader, verdicts, markTest = false }: InequalityStepsTableProps) {
  return (
    <div className="relative overflow-x-auto overflow-y-hidden">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="font-hand text-[20px] leading-tight font-bold">
            <th className="w-6.5 pb-2" aria-hidden="true" />
            <th className="pr-3 pb-2">{stepHeader}</th>
            <th className="pb-2 text-right whitespace-nowrap">{testHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.key}
              data-row={index}
              data-holds={row.holds}
              data-visible={row.visible}
              data-now={row.now || undefined}
              className={`transition-colors duration-300 ${row.visible ? '' : 'invisible'} ${row.now ? 'bg-highlight-soft' : ''}`}
            >
              <td className={`${cellClass} w-6.5 pl-1.5 font-hand text-[22px] leading-none font-bold text-muted`}>{index + 1}</td>
              <td className={cellClass}>
                <MathTex tex={row.tex} className="[&_.katex]:text-[1.08em]!" />
                {row.reason && (
                  <span
                    data-flip={row.flip || undefined}
                    className={`mt-0.5 block text-sm ${row.flip ? 'font-semibold text-marker' : 'text-muted'}`}
                  >
                    <MathText text={row.reason} />
                  </span>
                )}
              </td>
              <td className={`${cellClass} text-right whitespace-nowrap`}>
                {markTest ? (
                  <span
                    data-mark={row.holds}
                    className={`inline-block min-w-13.5 px-1.5 text-center ${row.holds ? 'bg-highlight dark:text-paper' : 'text-muted'}`}
                  >
                    <MathTex tex={row.testTex} />
                  </span>
                ) : (
                  <MathTex tex={row.testTex} />
                )}
                {verdicts && (
                  <span
                    className={`ml-2.5 inline-block min-w-13.5 px-1.5 text-center font-hand text-[21px] leading-tight font-bold ${row.holds ? 'bg-highlight dark:text-paper' : 'text-muted'}`}
                  >
                    {row.holds ? verdicts.holds : verdicts.fails}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
