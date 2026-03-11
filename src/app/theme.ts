import type { ThemePreference } from '../types/state'

export const THEME_PREFERENCE_STORAGE_KEY = 'job-search-helper.theme-preference'

const isThemePreference = (value: string | null): value is ThemePreference => value === 'light' || value === 'dark' || value === 'system'

export const readStoredThemePreference = (): ThemePreference => {
  if (typeof window === 'undefined') {
    return 'system'
  }

  try {
    const stored = window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export const getSystemPrefersDark = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const resolveThemePreference = (preference: ThemePreference, prefersDark: boolean): 'light' | 'dark' => {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light'
  }

  return preference
}

export const applyResolvedTheme = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export const persistThemePreference = (preference: ThemePreference) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference)
  } catch {
    // Ignore storage failures and keep the in-memory preference.
  }
}
