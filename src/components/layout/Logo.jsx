import { Box, Typography } from '@mui/material'
import { PuffyStar } from '../decor/PuffyStar'

// The logo star's color — a candy pink puffy star, shown fully visible and
// glowing (unlike the ambient background stars). Matches the favicon.
const LOGO_STAR_COLOR = '#f8a8d0'

/** Morph wordmark: a glowing puffy star sticker + the name. */
export function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          display: 'flex',
          transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          filter: `drop-shadow(0 0 10px ${LOGO_STAR_COLOR}88)`,
          '&:hover': { transform: 'rotate(-12deg) scale(1.08)' },
        }}
      >
        <PuffyStar color={LOGO_STAR_COLOR} size={40} />
      </Box>
      <Typography
        component="span"
        sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: 'text.primary' }}
      >
        Morph
      </Typography>
    </Box>
  )
}
