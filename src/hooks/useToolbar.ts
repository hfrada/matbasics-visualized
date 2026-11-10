import { useTranslation } from 'react-i18next'
import { languages } from '../i18n'
import { useTheme } from './useTheme'

export function useToolbar() {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  return {
    languages,
    currentLanguage: i18n.resolvedLanguage,
    onLanguageChange: (language: string) => i18n.changeLanguage(language),
    isDark: theme === 'dark',
    themeLabel: t('toolbar.darkMode'),
    onThemeToggle: toggleTheme,
  }
}
