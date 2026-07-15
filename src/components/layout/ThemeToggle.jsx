import { IconButton, Tooltip } from '@mui/material'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import { useThemeMode } from '../../theme/themeModeContext'

/** Moon/sun toggle that flips and persists the color mode. */
export function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <Tooltip title={isDark ? 'Switch to light' : 'Switch to dark'}>
      <IconButton
        onClick={toggleMode}
        aria-label="Toggle color theme"
        sx={{ color: 'text.primary' }}
      >
        {isDark ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
      </IconButton>
    </Tooltip>
  )
}
