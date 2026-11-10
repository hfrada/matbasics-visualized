import { Fragment } from 'react'
import { ToggleButton } from '../atoms/ToggleButton'

type LanguageSwitchProps = {
  languages: readonly string[]
  current: string | undefined
  onChange: (language: string) => void
}

export function LanguageSwitch({ languages, current, onChange }: LanguageSwitchProps) {
  return (
    <div className="flex items-center gap-1">
      {languages.map((language, index) => (
        <Fragment key={language}>
          {index > 0 && <span className="text-sm text-faint">|</span>}
          <ToggleButton active={language === current} onClick={() => onChange(language)}>
            {language.toUpperCase()}
          </ToggleButton>
        </Fragment>
      ))}
    </div>
  )
}
