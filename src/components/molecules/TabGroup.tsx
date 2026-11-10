import { TabButton } from '../atoms/TabButton'

type TabOption<T extends string> = {
  value: T
  label: string
}

type TabGroupProps<T extends string> = {
  options: TabOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function TabGroup<T extends string>({ options, value, onChange }: TabGroupProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      {options.map((option) => (
        <TabButton key={option.value} active={option.value === value} onClick={() => onChange(option.value)}>
          {option.label}
        </TabButton>
      ))}
    </div>
  )
}
