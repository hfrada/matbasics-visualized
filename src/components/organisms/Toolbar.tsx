import { LanguageSwitch } from '../molecules/LanguageSwitch'
import { ThemeToggle } from '../molecules/ThemeToggle'

type ToolbarProps = {
  languages: readonly string[]
  currentLanguage: string | undefined
  onLanguageChange: (language: string) => void
  isDark: boolean
  themeLabel: string
  onThemeToggle: () => void
}

export function Toolbar({
  languages,
  currentLanguage,
  onLanguageChange,
  isDark,
  themeLabel,
  onThemeToggle,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <LanguageSwitch languages={languages} current={currentLanguage} onChange={onLanguageChange} />
      <span className="h-4 w-px bg-faint/60" />
      <ThemeToggle isDark={isDark} label={themeLabel} onToggle={onThemeToggle} />
    </div>
  )
}
