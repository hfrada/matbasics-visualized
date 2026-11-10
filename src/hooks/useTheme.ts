import { useState } from 'react'

type Theme = 'light' | 'dark'

const storageKey = 'theme'

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(storageKey, next)
    } catch {}
    setTheme(next)
  }

  return { theme, toggleTheme }
}
