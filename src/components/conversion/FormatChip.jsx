import { Box, Typography } from '@mui/material'
import { keyframes } from '@mui/system'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { getFormat } from '../../config/conversions'

// Gentle "plop" as a sticker is placed — scales up past 1 then settles.
const plop = keyframes`
  0%   { opacity: 0; transform: scale(0.6) rotate(var(--tilt)); }
  60%  { opacity: 1; transform: scale(1.06) rotate(var(--tilt)); }
  100% { opacity: 1; transform: scale(1) rotate(var(--tilt)); }
`

// Springy easing with a touch of overshoot for tactile hover/press.
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

// Deterministic resting tilt per format so it's stable across renders but
// varied between chips (some lean left, some right).
function restingTilt(id, base) {
  let hash = 0
  for (let i = 0; i < String(id).length; i++) {
    hash = (hash * 31 + String(id).charCodeAt(i)) % 1000
  }
  const dir = hash % 2 === 0 ? 1 : -1
  const magnitude = 0.5 + (hash % 100) / 100 // 0.5 .. 1.5 of base
  return dir * base * magnitude
}

// Size presets. 'pair' is the large chip, 'chip' is the medium header badge,
// 'icon' is the small card/menu badge.
const SIZES = {
  pair: { width: { xs: 84, md: 104 }, height: { xs: 84, md: 104 }, radius: 18, fontSize: { xs: 22, md: 26 } },
  chip: { width: { xs: 66, md: 76 }, height: { xs: 66, md: 76 }, radius: 16, fontSize: { xs: 18, md: 21 } },
  icon: { width: 44, height: 44, radius: 12, fontSize: 0 },
}

/**
 * A pastel "sticker" block for a format. Physical sticker cues (die-cut peel
 * border, drop shadow, laminated sheen, hand-placed tilt, springy interactions)
 * come from theme.morph.sticker so intensity stays central.
 *
 * When `onClick` is provided the chip becomes an interactive button with a
 * little caret badge, signalling it opens a format picker.
 */
export function FormatChip({ formatId, size = 'pair', icon, onClick, ariaLabel }) {
  const format = getFormat(formatId)
  const dims = SIZES[size] ?? SIZES.pair
  const interactive = Boolean(onClick)

  return (
    <Box
      component={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-haspopup={interactive ? 'menu' : undefined}
      sx={(theme) => {
        const s = theme.morph.sticker
        const tilt = restingTilt(format.id, size === 'icon' ? s.tilt * 0.8 : s.tilt)
        return {
          '--tilt': `${tilt}deg`,
          position: 'relative',
          p: 0,
          font: 'inherit',
          width: dims.width,
          height: dims.height,
          borderRadius: `${dims.radius}px`,
          bgcolor: theme.morph.stickers[format.sticker],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: interactive ? 'pointer' : 'default',
          border: `${s.peelWidth}px solid ${s.peel}`,
          boxShadow: s.shadow,
          transform: `rotate(${tilt}deg)`,
          transformOrigin: 'center',
          transition: `transform 260ms ${SPRING}, box-shadow 260ms ease`,
          animation: `${plop} 420ms ${SPRING} both`,
          outline: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: s.sheen,
            pointerEvents: 'none',
            mixBlendMode: 'soft-light',
          },
          '@media (hover: hover)': {
            '&:hover': {
              transform: `rotate(${tilt * 0.15}deg) translateY(-4px) scale(1.05)`,
              boxShadow: s.shadowHover,
            },
          },
          '&:active': {
            transform: `rotate(${tilt}deg) translateY(0) scale(0.97)`,
            boxShadow: s.shadow,
          },
          '&:focus-visible': {
            boxShadow: `${s.shadowHover}, 0 0 0 3px ${theme.palette.primary.main}`,
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            transition: 'none',
          },
        }
      }}
    >
      {icon ?? (
        <Typography
          sx={{ position: 'relative', fontSize: dims.fontSize, fontWeight: 700, color: 'text.primary' }}
        >
          {format.label}
        </Typography>
      )}

      {interactive && (
        <Box
          aria-hidden
          sx={(theme) => ({
            position: 'absolute',
            bottom: -6,
            right: -6,
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: theme.palette.background.paper,
            border: `2px solid ${theme.morph.sticker.peel}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.morph.sticker.shadow,
          })}
        >
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16, color: 'text.primary' }} />
        </Box>
      )}
    </Box>
  )
}
