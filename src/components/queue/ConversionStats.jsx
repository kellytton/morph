import { Box, Paper, Typography } from '@mui/material'
import { formatBytes } from '../../utils/format'
import { STATUS } from '../../hooks/useConversionQueue'

function StatCard({ label, value, accent }) {
  return (
    <Paper
      sx={(theme) => ({
        p: { xs: 1.75, sm: 2.5 },
        textAlign: 'center',
        border: accent ? `2px solid ${theme.palette.primary.main}` : undefined,
      })}
    >
      <Typography sx={{ fontSize: { xs: 20, sm: 30 }, fontWeight: 700, lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography
        sx={{ fontSize: { xs: 12, sm: 14 }, color: 'text.secondary', fontWeight: 600, mt: 0.5 }}
      >
        {label}
      </Typography>
    </Paper>
  )
}

/**
 * Batch analytics shown once at least one conversion has finished. Sums the
 * original vs converted sizes across all completed items.
 */
export function ConversionStats({ items }) {
  const done = items.filter((it) => it.status === STATUS.DONE && it.result)
  if (done.length === 0) return null

  const originalTotal = done.reduce((sum, it) => sum + it.file.size, 0)
  const convertedTotal = done.reduce((sum, it) => sum + it.result.size, 0)
  const saved = originalTotal - convertedTotal
  const pct = originalTotal ? Math.round((saved / originalTotal) * 100) : 0

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      <StatCard label="Files processed" value={done.length} />
      <StatCard label="Original size" value={formatBytes(originalTotal)} />
      <StatCard label="Converted size" value={formatBytes(convertedTotal)} />
      <StatCard
        label={saved >= 0 ? 'Space saved' : 'Size added'}
        value={`${saved >= 0 ? '' : '+'}${formatBytes(Math.abs(saved))}${pct ? ` (${Math.abs(pct)}%)` : ''}`}
        accent={saved > 0}
      />
    </Box>
  )
}
