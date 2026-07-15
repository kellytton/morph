import { createTheme, alpha } from '@mui/material/styles'
import { palettes, stickerSwatches } from './palette'

// Signature "stickery" rounding used across cards, chips, and buttons.
const RADIUS = 22

/**
 * Builds a fully-themed MUI theme for a given mode ('light' | 'dark').
 * All stickery visual language (rounding, chunky borders, Baloo font,
 * soft surfaces) lives here so components stay declarative.
 */
export function createMorphTheme(mode) {
  const p = palettes[mode]

  // Resolve sticker swatches for the current mode into a flat map.
  const stickers = Object.fromEntries(
    Object.entries(stickerSwatches).map(([key, v]) => [key, v[mode]]),
  )

  return createTheme({
    palette: {
      mode,
      primary: { main: p.brand },
      background: { default: p.background, paper: p.surface },
      text: { primary: p.text, secondary: p.textMuted },
      divider: p.border,
    },

    // Custom namespace for tokens MUI's palette doesn't cover.
    morph: {
      surface: p.surface,
      surfaceMuted: p.surfaceMuted,
      border: p.border,
      borderMuted: p.borderMuted,
      dropZoneBorder: p.dropZoneBorder,
      textMuted: p.textMuted,
      stickers,
      radius: RADIUS,

      // Physical "sticker" cues, tuned per mode. Kept here so intensity is
      // adjusted in one place and every chip stays consistent.
      sticker: {
        // Die-cut peel outline. White in light mode; a soft light ring in
        // dark mode (pure white would be too harsh on the dark surface).
        peel: mode === 'light' ? '#ffffff' : alpha('#ffffff', 0.72),
        peelWidth: 3,
        // Drop shadow so the sticker sits on top of the surface.
        shadow:
          mode === 'light'
            ? '0 6px 14px rgba(60, 45, 30, 0.18)'
            : '0 6px 16px rgba(0, 0, 0, 0.45)',
        shadowHover:
          mode === 'light'
            ? '0 12px 22px rgba(60, 45, 30, 0.24)'
            : '0 12px 26px rgba(0, 0, 0, 0.55)',
        // Faint laminated-vinyl sheen swept across the top-left.
        sheen: `linear-gradient(135deg, ${alpha('#ffffff', 0.45)} 0%, ${alpha(
          '#ffffff',
          0.12,
        )} 32%, ${alpha('#ffffff', 0)} 60%)`,
        // Resting hand-placed tilt (degrees). Small = tasteful.
        tilt: 2.5,
      },

      // Glassmorphism for cards/panels so the background stars peek through.
      // Translucent surface + backdrop blur + a subtle light top border.
      glass: {
        bg: alpha(p.surface, mode === 'light' ? 0.7 : 0.62),
        blur: 'blur(16px)',
        border: `1px solid ${alpha('#ffffff', mode === 'light' ? 0.6 : 0.08)}`,
        shadow:
          mode === 'light'
            ? '0 8px 30px rgba(60, 45, 30, 0.10)'
            : '0 8px 30px rgba(0, 0, 0, 0.32)',
      },
    },

    shape: { borderRadius: RADIUS },

    typography: {
      fontFamily: '"Baloo 2", system-ui, sans-serif',
      // Baloo reads heavy, so lean on the lighter weights for body copy.
      fontWeightRegular: 500,
      fontWeightMedium: 600,
      fontWeightBold: 700,
      h1: { fontWeight: 700, letterSpacing: '-0.5px' },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      button: { fontWeight: 600, textTransform: 'none' },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: p.background,
            transition: 'background-color 240ms ease',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: RADIUS,
            // Glass by default so stars behind show through.
            backgroundColor: alpha(p.surface, mode === 'light' ? 0.7 : 0.62),
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${alpha('#ffffff', mode === 'light' ? 0.6 : 0.08)}`,
            boxShadow:
              mode === 'light'
                ? '0 8px 30px rgba(60, 45, 30, 0.10)'
                : '0 8px 30px rgba(0, 0, 0, 0.32)',
          },
        },
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: true },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 20,
            paddingBlock: 8,
            transition: 'transform 140ms ease, background-color 140ms ease',
            '&:hover': { transform: 'translateY(-1px)' },
            '&:active': { transform: 'translateY(0)' },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'transform 160ms ease, color 160ms ease',
            '&:hover': { transform: 'rotate(-8deg) scale(1.08)' },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: p.text,
            color: p.background,
            fontWeight: 600,
            borderRadius: 10,
            fontSize: 12,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `2px solid ${p.text}`,
            borderRadius: RADIUS,
            boxShadow: `0 12px 30px ${alpha(p.text, 0.18)}`,
          },
        },
      },
    },
  })
}
