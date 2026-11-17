import { MathTex } from '../atoms/MathTex'
import { MathText } from '../atoms/MathText'

export type FormulaItem = { key: string; tex: string; remark: string }

export function FormulaList({ items }: { items: FormulaItem[] }) {
  return (
    <div className="grid gap-3.5">
      {items.map((item) => (
        <p key={item.key} data-formula-item={item.key}>
          <span className="block overflow-x-auto overflow-y-hidden">
            <MathTex tex={item.tex} />
          </span>
          <span className="mt-1 block text-[15px] text-muted">
            <MathText text={item.remark} />
          </span>
        </p>
      ))}
    </div>
  )
}
