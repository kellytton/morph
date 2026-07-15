import { Paper, Typography, Slider, Stack } from '@mui/material'

// Max value on the slider means "don't resize" — lossless formats can't trade
// quality for size, so downscaling the longest edge is the real size lever.
export const RESIZE_OFF = 8000

const MARKS = [
  { value: 640, label: '640' },
  { value: 1280, label: '1280' },
  { value: 1920, label: '1920' },
  { value: 4000, label: '4000' },
  { value: RESIZE_OFF, label: 'Full' },
]

/**
 * A max-dimension control for lossless formats (png/bmp/ico), where a quality
 * slider does nothing. The user caps the longest edge; the image is downscaled
 * to fit (aspect ratio kept, never upscaled). At the top of the range it reads
 * "Full size" — no resize, just a metadata-stripping re-encode.
 *
 * `value` is the max-edge in px (RESIZE_OFF = no cap); `onChange(next)` reports.
 */
export function ResizeControl({ value, onChange, hint }) {
  const off = value >= RESIZE_OFF
  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack
        direction="row"
        sx={{ mb: 1, width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 17 }}>Max size</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 17, color: 'primary.main' }}>
          {off ? 'Full size' : `${value}px`}
        </Typography>
      </Stack>
      <Slider
        value={value}
        min={480}
        max={RESIZE_OFF}
        step={null}
        marks={MARKS}
        onChange={(_, v) => onChange(v)}
        aria-label="Maximum image dimension"
        sx={{ '& .MuiSlider-thumb': { width: 20, height: 20 } }}
      />
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {hint ??
          'Lossless formats keep every pixel, so shrinking the largest edge is the way to save space. Aspect ratio is kept; images are never enlarged.'}
      </Typography>
    </Paper>
  )
}
