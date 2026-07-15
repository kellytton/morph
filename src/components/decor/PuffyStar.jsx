import { useId } from 'react'
import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'

// A rounded, chunky 5-point star path (soft points, puffy body) on a 100x100
// viewBox. Cubic curves round every tip and inner notch for the gel look.
const STAR_PATH = `
  M50 10
  C54 10 57 13 59 20
  L64 35
  C66 41 69 43 75 44
  L88 46
  C95 47 98 53 93 58
  L83 68
  C79 72 78 76 79 82
  L81 92
  C82 99 76 103 70 99
  L58 93
  C53 90 47 90 42 93
  L30 99
  C24 103 18 99 19 92
  L21 82
  C22 76 21 72 17 68
  L7 58
  C2 53 5 47 12 46
  L25 44
  C31 43 34 41 36 35
  L41 20
  C43 13 46 10 50 10
  Z
`

/**
 * A single puffy/gel pastel star rendered as self-contained SVG so it stays
 * crisp at any size and needs no image assets. `color` is a hex from the
 * sticker palette; the gel shading (gradient body, soft rim, specular
 * highlight) is derived from it.
 */
export function PuffyStar({ color, size = 120, sx }) {
  const id = useId()
  const bodyId = `body-${id}`
  const rimId = `rim-${id}`
  const glossId = `gloss-${id}`

  // Derived shades for the 3D read: lighter top-left, richer bottom-right.
  const light = alpha('#ffffff', 0.85)
  const mid = color
  const deep = alpha('#000000', 0.12)

  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      aria-hidden
      sx={{ width: size, height: size, display: 'block', overflow: 'visible', ...sx }}
    >
      <defs>
        {/* Main body: diagonal gradient from bright highlight to saturated base. */}
        <linearGradient id={bodyId} x1="30%" y1="18%" x2="72%" y2="88%">
          <stop offset="0%" stopColor={alpha('#ffffff', 0.9)} />
          <stop offset="38%" stopColor={mid} />
          <stop offset="100%" stopColor={mid} />
        </linearGradient>
        {/* Rim light hugging the outer edge for a candy-shell edge. */}
        <radialGradient id={rimId} cx="50%" cy="46%" r="58%">
          <stop offset="72%" stopColor={alpha('#ffffff', 0)} />
          <stop offset="100%" stopColor={light} />
        </radialGradient>
        {/* Specular gloss blob near the top. */}
        <radialGradient id={glossId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={alpha('#ffffff', 0.95)} />
          <stop offset="100%" stopColor={alpha('#ffffff', 0)} />
        </radialGradient>
      </defs>

      {/* Soft contact shadow under the star. */}
      <path d={STAR_PATH} fill={deep} transform="translate(0 3)" opacity="0.5" />
      {/* Body. */}
      <path d={STAR_PATH} fill={`url(#${bodyId})`} />
      {/* Candy rim highlight. */}
      <path d={STAR_PATH} fill={`url(#${rimId})`} />
      {/* Glossy specular highlight (a soft rounded blob up top). */}
      <ellipse cx="42" cy="34" rx="15" ry="10" fill={`url(#${glossId})`} transform="rotate(-20 42 34)" />
      {/* Tiny sparkle dot for extra shine. */}
      <circle cx="62" cy="30" r="3.2" fill={alpha('#ffffff', 0.8)} />
    </Box>
  )
}
