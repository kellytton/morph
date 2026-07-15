import { Box, Typography } from '@mui/material'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import { PuffyStar } from '../components/decor/PuffyStar'
import { StickerButton } from '../components/common/StickerButton'

// A candy star for the mascot, matching the logo's glow.
const STAR_COLOR = '#f8a8d0'

/**
 * Friendly 404 shown for any path that isn't the app root. On-brand (a glowing
 * puffy star, playful copy) with a sticker button back to home. `onGoHome`
 * resets to the default view in-app; the button is also a real /-link so
 * middle/cmd-click and crawlers behave.
 */
export function NotFoundPage({ onGoHome }) {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        py: { xs: 6, md: 10 },
      }}
    >
      <Box
        sx={{
          filter: `drop-shadow(0 0 16px ${STAR_COLOR}88)`,
          animation: 'nf-bob 3.4s ease-in-out infinite',
          '@keyframes nf-bob': {
            '0%,100%': { transform: 'translateY(0) rotate(-6deg)' },
            '50%': { transform: 'translateY(-12px) rotate(6deg)' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        <PuffyStar color={STAR_COLOR} size={112} />
      </Box>

      <Typography component="h1" sx={{ fontSize: { xs: 64, md: 88 }, fontWeight: 700, lineHeight: 1, m: 0 }}>
        404
      </Typography>
      <Typography component="p" sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>
        This page drifted off into space
      </Typography>
      {/* Use text.primary at a slight opacity rather than text.secondary: the
          muted secondary is too dim to read on the dark background (and a
          floating star can sit behind it). This stays legible in both themes. */}
      <Typography sx={{ color: 'text.primary', opacity: 0.8, fontWeight: 500, maxWidth: 460 }}>
        We couldn&apos;t find what you were looking for. Let&apos;s get you back to converting,
        compressing, and merging.
      </Typography>

      <Box sx={{ mt: 2 }}>
        <StickerButton
          sticker="pink"
          startIcon={<HomeRoundedIcon sx={{ fontSize: 20 }} />}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
            e.preventDefault()
            onGoHome?.()
          }}
          component="a"
          href="/"
        >
          Back to Morph
        </StickerButton>
      </Box>
    </Box>
  )
}
