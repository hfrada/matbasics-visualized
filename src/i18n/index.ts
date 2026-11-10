import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import id from './id.json'

export const languages = ['en', 'id'] as const

type Language = (typeof languages)[number]

const storageKey = 'language'

function isLanguage(value: string | null): value is Language {
  return languages.some((language) => language === value)
}

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(storageKey)
    return isLanguage(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
  try {
    localStorage.setItem(storageKey, language)
  } catch {}
})

export default i18n
