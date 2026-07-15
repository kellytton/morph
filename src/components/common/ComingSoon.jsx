import { Paper, Typography } from '@mui/material'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'

/** Friendly placeholder panel for features not yet available client-side. */
export function ComingSoon({ title, message }) {
  return (
    <Paper
      sx={{
        p: { xs: 4, md: 6 },
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <AutoAwesomeRoundedIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
      <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>{title}</Typography>
      <Typography sx={{ color: 'text.secondary', fontWeight: 500, maxWidth: 440 }}>
        {message}
      </Typography>
    </Paper>
  )
}
