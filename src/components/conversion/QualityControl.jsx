import { Paper, Typography, Slider, Stack } from '@mui/material'

/**
 * A compact quality slider for lossy encodes (jpg/webp/avif). Shared by the
 * convert and compress workspaces so the size/quality tradeoff is presented
 * consistently. `value` is 0–100; `onChange(next)` reports changes.
 */
export function QualityControl({ value, onChange, hint }) {
  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack
        direction="row"
        sx={{ mb: 1, width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 17 }}>Quality</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 17, color: 'primary.main' }}>
          {value}%
        </Typography>
      </Stack>
      <Slider
        value={value}
        min={10}
        max={100}
        onChange={(_, v) => onChange(v)}
        aria-label="Output quality"
        sx={{ '& .MuiSlider-thumb': { width: 20, height: 20 } }}
      />
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {hint ?? 'Lower quality means smaller files. Set this before dropping your files.'}
      </Typography>
    </Paper>
  )
}
