import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { CheckIcon } from '../atoms/CheckIcon'
import { ChevronIcon } from '../atoms/ChevronIcon'
import { PenButton } from '../atoms/PenButton'

type SelectOption<T> = {
  value: T
  label: string
}

type PenSelectProps<T extends string | number> = {
  label: string
  options: SelectOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function PenSelect<T extends string | number>({ label, options, value, onChange }: PenSelectProps<T>) {
  const id = useId()
  const listId = `${id}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selectedIndex = options.findIndex((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    listRef.current?.focus()

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function openList() {
    setActiveIndex(Math.max(0, selectedIndex))
    setOpen(true)
  }

  function close(returnFocus: boolean) {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  function choose(index: number) {
    onChange(options[index].value)
    close(true)
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    openList()
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const last = options.length - 1
    switch (event.key) {
      case 'ArrowDown':
        setActiveIndex((index) => Math.min(last, index + 1))
        break
      case 'ArrowUp':
        setActiveIndex((index) => Math.max(0, index - 1))
        break
      case 'Home':
        setActiveIndex(0)
        break
      case 'End':
        setActiveIndex(last)
        break
      case 'Enter':
      case ' ':
        choose(activeIndex)
        break
      case 'Escape':
        close(true)
        break
      case 'Tab':
        close(false)
        return
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <div ref={rootRef} className="relative">
      <PenButton
        ref={triggerRef}
       
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        className="gap-1.5 px-3.5"
      >
        <span className="font-normal text-muted">{label}</span>
        <span>{options[selectedIndex]?.label}</span>
        <ChevronIcon className={`transition ${open ? 'rotate-180' : ''}`} />
      </PenButton>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${activeIndex}`}
          onKeyDown={handleListKeyDown}
          className="pen-border absolute top-[calc(100%+10px)] -left-1 z-10 min-w-[calc(100%+8px)] bg-paper px-1.5 py-2 text-sm font-medium outline-none"
        >
          {options.map((option, index) => (
            <li
              key={String(option.value)}
              id={`${id}-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onPointerMove={() => setActiveIndex(index)}
              onClick={() => choose(index)}
              className={`flex cursor-pointer items-center gap-2 rounded-md py-1.5 pr-3 pl-2 whitespace-nowrap ${index === activeIndex ? 'bg-highlight' : ''}`}
            >
              <CheckIcon className={index === selectedIndex ? '' : 'invisible'} />
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
