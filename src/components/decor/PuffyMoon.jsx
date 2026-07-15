import { useId } from 'react'
import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'

/**
 * A puffy/gel crescent moon rendered as self-contained SVG, matching the
 * PuffyStar aesthetic (gradient body, rim light, gloss, soft shadow). `color`
 * is a hex from the sticker palette.
 */
export function PuffyMoon({ color, size = 120, sx }) {
  const id = useId()
  const bodyId = `moon-body-${id}`
  const glossId = `moon-gloss-${id}`

  // Crescent = big disc minus an offset disc (via even-odd fill).
  const crescent =
    'M62 8 a42 42 0 1 0 0 84 a34 34 0 1 1 0 -84 Z'

  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      aria-hidden
      sx={{ width: size, height: size, display: 'block', overflow: 'visible', ...sx }}
    >
      <defs>
        <linearGradient id={bodyId} x1="25%" y1="15%" x2="75%" y2="90%">
          <stop offset="0%" stopColor={alpha('#ffffff', 0.92)} />
          <stop offset="42%" stopColor={color} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <radialGradient id={glossId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={alpha('#ffffff', 0.95)} />
          <stop offset="100%" stopColor={alpha('#ffffff', 0)} />
        </radialGradient>
      </defs>

      {/* Soft contact shadow. */}
      <path d={crescent} fillRule="evenodd" fill={alpha('#000000', 0.12)} transform="translate(0 3)" opacity="0.5" />
      {/* Body. */}
      <path d={crescent} fillRule="evenodd" fill={`url(#${bodyId})`} />
      {/* Gloss highlight near the top of the crescent. */}
      <ellipse cx="40" cy="26" rx="11" ry="7" fill={`url(#${glossId})`} transform="rotate(-25 40 26)" />
    </Box>
  )
}
