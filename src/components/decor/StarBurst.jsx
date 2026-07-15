import { Box, useTheme } from '@mui/material'
import { keyframes } from '@mui/system'
import { PuffyStar } from './PuffyStar'

// Each particle flies outward to its own (x, y) offset while spinning and
// fading. Custom props drive the trajectory so one keyframe fits all.
const burst = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.2) rotate(0deg); }
  25%  { opacity: 1; }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy)))
               scale(var(--s)) rotate(var(--r));
  }
`

// A fixed spray of particles: colors from the sticker palette, angles fanned
// around the circle so the burst reads full. Deterministic (no randomness) so
// it's stable and SSR-safe.
const PARTICLES = [
  { color: 'pink',  dx: -46, dy: -40, s: 1.0, r: 160, size: 20, delay: 0 },
  { color: 'lemon', dx: 40,  dy: -48, s: 0.9, r: -140, size: 16, delay: 30 },
  { color: 'blue',  dx: 58,  dy: -6,  s: 1.1, r: 120, size: 22, delay: 10 },
  { color: 'mint',  dx: 44,  dy: 40,  s: 0.85, r: -170, size: 15, delay: 50 },
  { color: 'lilac', dx: -8,  dy: 58,  s: 1.0, r: 150, size: 18, delay: 20 },
  { color: 'peach', dx: -50, dy: 34,  s: 0.9, r: -130, size: 17, delay: 40 },
  { color: 'pink',  dx: -60, dy: 4,   s: 0.8, r: 110, size: 14, delay: 60 },
]

/**
 * A one-shot celebratory burst of tiny puffy stars, centered on its parent.
 * Purely decorative and non-interactive. Renders nothing meaningful for
 * reduced-motion users (the animation is suppressed via CSS).
 */
export function StarBurst() {
  const theme = useTheme()

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 2,
        // The particles fly outward past this 0×0 origin. `contain: layout size`
        // keeps that overflow from expanding the page's scroll area (which was
        // adding empty space below the footer). Purely visual — the stars still
        // render outside via overflow: visible on the particle boxes.
        contain: 'layout size',
      }}
    >
      {PARTICLES.map((p, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--s': p.s,
            '--r': `${p.r}deg`,
            animation: `${burst} 900ms ${p.delay}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
            filter: `drop-shadow(0 0 6px ${theme.morph.stickers[p.color]}88)`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0 },
          }}
        >
          <PuffyStar color={theme.morph.stickers[p.color]} size={p.size} />
        </Box>
      ))}
    </Box>
  )
}
