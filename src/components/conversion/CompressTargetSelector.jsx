import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { FormatChip } from './FormatChip'
import { FormatPicker } from './FormatPicker'
import { COMPRESS_FORMATS } from '../../config/conversions'
import { isEncodable, isMediaFormat } from '../../converters/registry'

/**
 * Compact "Compress → [FORMAT]" control for the compress workspace header, so
 * the user can switch what they're compressing without reopening the nav menu
 * — the compress-page counterpart to convert's TargetSelector.
 *
 * Options are the compress menu's formats (kept in sync via COMPRESS_FORMATS),
 * minus the current one. `onChangeFormat(next)` reports the choice.
 */
export function CompressTargetSelector({ format, onChangeFormat }) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(null)

  // Offer other compress formats, minus any image format this browser can't
  // re-encode (e.g. AVIF on older Safari) so switching never hits a dead-end.
  const options = COMPRESS_FORMATS.filter(
    (id) => id !== format && (isMediaFormat(id) || isEncodable(id)),
  ).map((id) => ({ id }))

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
      <Typography
        sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 700, color: 'text.secondary' }}
      >
        Compress
      </Typography>

      <FormatChip
        formatId={format}
        size="chip"
        onClick={(e) => {
          setAnchor(e.currentTarget)
          setOpen(true)
        }}
        ariaLabel={`Compressing ${format}. Click to change.`}
      />

      <FormatPicker
        anchorEl={anchor}
        open={open}
        onClose={() => setOpen(false)}
        options={options}
        onSelect={(next) => onChangeFormat?.(next)}
      />
    </Box>
  )
}
