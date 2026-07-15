import { Box, Typography, Link, useTheme } from '@mui/material'
import { keyframes } from '@mui/system'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import { PuffyStar } from '../decor/PuffyStar'
import { PuffyMoon } from '../decor/PuffyMoon'

const PORTFOLIO_URL = 'https://kellyton.netlify.app/'

// Gentle twinkle for the footer's little decorations.
const twinkle = keyframes`
  0%, 100% { transform: translateY(0) rotate(var(--rot)); opacity: var(--op); }
  50%      { transform: translateY(-6px) rotate(calc(var(--rot) + 6deg)); opacity: 1; }
`

// A moon + a spray of small puffy stars decorating the footer band.
const DECOR = [
  { type: 'moon', color: 'lemon', size: 54, top: '18%', left: '8%',  rot: -12, op: 0.85, dur: 7,   hideDown: true },
  { type: 'star', color: 'pink',  size: 30, top: '58%', left: '17%', rot: 10,  op: 0.8,  dur: 6,   hideDown: true },
  { type: 'star', color: 'blue',  size: 22, top: '26%', left: '30%', rot: -18, op: 0.7,  dur: 8,   hideDown: true },
  { type: 'star', color: 'lilac', size: 26, top: '64%', left: '82%', rot: 14,  op: 0.8,  dur: 6.5, hideDown: false },
  { type: 'moon', color: 'blue',  size: 40, top: '24%', left: '90%', rot: 20,  op: 0.75, dur: 7.5, hideDown: false },
  { type: 'star', color: 'mint',  size: 20, top: '70%', left: '70%', rot: -8,  op: 0.7,  dur: 9,   hideDown: true },
]

/**
 * Spacious, space-themed footer: puffy stars + moons scattered across the
 * band, the copyright line, and a stickery link to the portfolio. Decorations
 * respect prefers-reduced-motion.
 */
export function Footer() {
  const theme = useTheme()

  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        mt: { xs: 6, md: 10 },
        px: { xs: 3, md: 6 },
        py: { xs: 6, md: 9 },
        // No hard divider — a soft gradient wash lets the footer melt into the
        // page like the horizon of its own little sky.
        background: `linear-gradient(180deg, transparent 0%, ${
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.035)'
            : 'rgba(255,255,255,0.5)'
        } 100%)`,
      }}
    >
      {/* Decorative moons + stars. */}
      {DECOR.map((d, i) => {
        const fill = theme.morph.stickers[d.color]
        const glow =
          theme.palette.mode === 'dark' ? `drop-shadow(0 0 10px ${fill}66)` : 'none'
        const Comp = d.type === 'moon' ? PuffyMoon : PuffyStar
        return (
          <Box
            key={i}
            aria-hidden
            sx={{
              position: 'absolute',
              top: d.top,
              left: d.left,
              '--rot': `${d.rot}deg`,
              '--op': d.op,
              opacity: d.op,
              filter: glow,
              transform: `rotate(${d.rot}deg)`,
              animation: `${twinkle} ${d.dur}s ease-in-out infinite`,
              display: d.hideDown ? { xs: 'none', md: 'block' } : 'block',
              pointerEvents: 'none',
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            <Comp color={fill} size={d.size} />
          </Box>
        )
      })}

      {/* Content. */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1080,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2.5,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 700 }}>
          Made with stars & pixels
        </Typography>

        <Link
          href={PORTFOLIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          sx={(t) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 2.5,
            py: 1,
            borderRadius: 999,
            fontWeight: 700,
            color: 'text.primary',
            bgcolor: t.morph.stickers.lilac,
            border: `2px solid ${t.morph.sticker.peel}`,
            boxShadow: t.morph.sticker.shadow,
            transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease',
            '&:hover': {
              transform: 'translateY(-2px) rotate(-2deg)',
              boxShadow: t.morph.sticker.shadowHover,
            },
            '&:active': { transform: 'translateY(0) scale(0.97)' },
          })}
        >
          visit my portfolio
          <ArrowOutwardRoundedIcon sx={{ fontSize: 18 }} />
        </Link>

        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
          © 2026 Kelly Ton
        </Typography>
      </Box>
    </Box>
  )
}
