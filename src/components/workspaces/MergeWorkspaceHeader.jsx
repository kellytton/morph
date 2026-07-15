import { Box, Paper, Typography } from '@mui/material'

/**
 * Shared header card for the merge-family workspaces (merge / split / edit).
 * Shows a lilac sticker icon, the operation title, and a one-line subtitle.
 */
export function MergeWorkspaceHeader({ icon, title, subtitle }) {
  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', alignItems: 'center', gap: 2.5 }}>
      <Box
        sx={(t) => ({
          width: 44,
          height: 44,
          borderRadius: '12px',
          bgcolor: t.morph.stickers.lilac,
          border: `2px solid ${t.morph.sticker.peel}`,
          boxShadow: t.morph.sticker.shadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        })}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>{subtitle}</Typography>
      </Box>
    </Paper>
  )
}
