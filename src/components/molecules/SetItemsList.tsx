import { MathTex } from '../atoms/MathTex'

export type SetItem = { key: string; tex: string; lit: boolean }

export function SetItemsList({ head, items, tail = '\\}' }: { head: string; items: SetItem[]; tail?: string }) {
  return (
    <p className="leading-loose">
      <MathTex tex={head} />{' '}
      {items.map((item, index) => (
        <span key={item.key}>
          <span data-set-item={item.key} data-lit={item.lit || undefined} className={`inline-block rounded-[3px] px-0.75 ${item.lit ? 'bg-highlight-soft' : ''}`}>
            <MathTex tex={item.tex + (index < items.length - 1 ? ',' : '')} />
          </span>{' '}
        </span>
      ))}
      <MathTex tex={tail} />
    </p>
  )
}
