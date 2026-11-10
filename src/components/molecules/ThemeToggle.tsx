import { IconButton } from '../atoms/IconButton'
import { MoonIcon } from '../atoms/MoonIcon'
import { SunIcon } from '../atoms/SunIcon'

type ThemeToggleProps = {
  isDark: boolean
  label: string
  onToggle: () => void
}

export function ThemeToggle({ isDark, label, onToggle }: ThemeToggleProps) {
  return (
    <IconButton aria-label={label} aria-pressed={isDark} onClick={onToggle}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  )
}
