import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronIcon } from '../atoms/ChevronIcon'

type SwitcherItem = {
  label: string
  to: string
}

type TopicSwitcherProps = {
  label: string
  items: SwitcherItem[]
  currentIndex: number
}

export function TopicSwitcher({ label, items, currentIndex }: TopicSwitcherProps) {
  const listId = useId()
  const rootRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <span ref={rootRef} className="relative max-md:static">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-1 text-ink"
      >
        {label}
        <ChevronIcon className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          id={listId}
          className="pen-border absolute top-[calc(100%+12px)] -left-2 z-20 min-w-72 bg-paper px-1.5 py-2 max-md:top-[calc(100%+10px)] max-md:right-0 max-md:left-0 max-md:min-w-0"
        >
          {items.map((item, index) => (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={index === currentIndex ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 ${index === currentIndex ? 'bg-highlight' : 'hover:bg-highlight-soft'}`}
              >
                <span className="min-w-5 font-hand text-muted">{index + 1}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}
