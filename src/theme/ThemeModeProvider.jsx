import { useMemo } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createMorphTheme } from './createMorphTheme'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { ThemeModeContext } from './themeModeContext'

/**
 * Owns the light/dark mode, persists the choice, and provides the built
 * MUI theme to the tree. Defaults to dark to match the primary mockup.
 */
// Allow ?theme=light|dark to force a mode (useful for previews/deep links).
function initialModeOverride() {
  if (typeof window === 'undefined') return null
  const param = new URLSearchParams(window.location.search).get('theme')
  return param === 'light' || param === 'dark' ? param : null
}

export function ThemeModeProvider({ children }) {
  const [stored, setStored] = useLocalStorage('morph:theme', 'dark')
  const override = initialModeOverride()
  const mode = override ?? stored
  const setMode = setStored

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
      setMode,
    }),
    [mode, setMode],
  )

  const theme = useMemo(() => createMorphTheme(mode), [mode])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
