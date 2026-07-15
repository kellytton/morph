import { ButtonBase } from '@mui/material'

/**
 * A primary action button in the sticker style: pastel sticker fill, die-cut
 * peel border, soft shadow, springy hover. Text uses text.primary so it reads
 * correctly in both themes (like the format chips). `sticker` picks the swatch.
 */
export function StickerButton({
  children,
  onClick,
  disabled,
  startIcon,
  sticker = 'blue',
  size = 'medium',
  sx,
  ...rest
}) {
  const pad = size === 'small' ? { px: 1.75, py: 0.6, fontSize: 14 } : { px: 2.25, py: 0.9, fontSize: 15 }
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        borderRadius: 999,
        fontWeight: 700,
        color: 'text.primary',
        ...pad,
        bgcolor: theme.morph.stickers[sticker],
        border: `2px solid ${theme.morph.sticker.peel}`,
        boxShadow: theme.morph.sticker.shadow,
        transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 180ms ease, opacity 160ms ease',
        '@media (hover: hover)': {
          '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.morph.sticker.shadowHover },
        },
        '&:active': { transform: 'translateY(0) scale(0.97)' },
        '&.Mui-disabled, &:disabled': {
          // 0.6 keeps the label above the 4.5:1 contrast floor while still
          // reading clearly as disabled (0.45 fell to ~2.6:1).
          opacity: 0.6,
          boxShadow: 'none',
          transform: 'none',
        },
        '&:focus-visible': {
          outline: 'none',
          boxShadow: `${theme.morph.sticker.shadowHover}, 0 0 0 3px ${theme.palette.primary.main}`,
        },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        ...sx,
      })}
      {...rest}
    >
      {startIcon}
      {children}
    </ButtonBase>
  )
}
