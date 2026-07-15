import { createContext, useContext } from 'react'

export const ThemeModeContext = createContext({
  mode: 'dark',
  toggleMode: () => {},
  setMode: () => {},
})

export function useThemeMode() {
  return useContext(ThemeModeContext)
}
