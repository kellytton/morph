import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { FormatChip } from './FormatChip'
import { FormatPicker } from './FormatPicker'
import { mediaPickerOptions } from '../../converters/registry'

/**
 * "Convert to → [TARGET]" control for media, folded into the upload card's
 * empty state. The picker lists targets within the current family (video/gif
 * for a video target, audio for an audio target).
 */
export function MediaTargetSelector({ to, onChangeTarget }) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(null)

  // Options are every target in the current target's family (video/gif or
  // audio), minus the current one — the family is fully determined by `to`.
  const options = mediaPickerOptions(to, to)

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
      <Typography
        sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 700, color: 'text.secondary' }}
      >
        Convert to
      </Typography>

      <FormatChip
        formatId={to}
        size="chip"
        onClick={(e) => {
          setAnchor(e.currentTarget)
          setOpen(true)
        }}
        ariaLabel={`Output format: ${to}. Click to change.`}
      />

      <FormatPicker
        anchorEl={anchor}
        open={open}
        onClose={() => setOpen(false)}
        options={options}
        onSelect={(next) => onChangeTarget?.(next)}
      />
    </Box>
  )
}
