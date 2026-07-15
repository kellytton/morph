import { Box, ButtonBase } from '@mui/material'

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

/**
 * A segmented control in the sticker style: each option is a pastel pill with a
 * die-cut peel border and soft shadow. The selected option is fully inked and
 * lifted; unselected options sit flat and muted. A playful, on-brand stand-in
 * for MUI's ToggleButtonGroup.
 *
 * `options`: [{ value, label, sticker?, icon? }]  — `sticker` picks the swatch.
 * `value` / `onChange(value)`: controlled selection.
 */
export function StickerToggle({ options, value, onChange, size = 'medium', sx, ariaLabel }) {
  const pad = size === 'small' ? { px: 1.5, py: 0.5, fontSize: 13.5 } : { px: 2, py: 0.75, fontSize: 15 }
  return (
    <Box
      role="group"
      aria-label={ariaLabel}
      sx={{
        display: 'inline-flex',
        gap: 1,
        p: 0.5,
        borderRadius: 999,
        ...sx,
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <ButtonBase
            key={opt.value}
            onClick={() => onChange?.(opt.value)}
            aria-pressed={selected}
            aria-label={opt.label}
            sx={(theme) => {
              const s = theme.morph.sticker
              const swatch = theme.morph.stickers[opt.sticker ?? 'blue']
              return {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.6,
                borderRadius: 999,
                fontWeight: 700,
                color: 'text.primary',
                ...pad,
                bgcolor: selected ? swatch : 'transparent',
                border: `2px solid ${selected ? s.peel : theme.palette.divider}`,
                boxShadow: selected ? s.shadow : 'none',
                opacity: selected ? 1 : 0.7,
                transform: selected ? 'translateY(-1px)' : 'none',
                transition: `transform 200ms ${SPRING}, box-shadow 200ms ease, background-color 200ms ease, opacity 160ms ease`,
                '@media (hover: hover)': {
                  '&:hover': {
                    opacity: 1,
                    transform: selected ? 'translateY(-2px)' : 'translateY(-1px)',
                    boxShadow: selected ? s.shadowHover : 'none',
                    bgcolor: selected ? swatch : 'action.hover',
                  },
                },
                '&:active': { transform: 'translateY(0) scale(0.97)' },
                '&:focus-visible': {
                  outline: 'none',
                  boxShadow: `0 0 0 3px ${theme.palette.primary.main}`,
                },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }
            }}
          >
            {opt.icon}
            {opt.label}
          </ButtonBase>
        )
      })}
    </Box>
  )
}
