import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { FormatChip } from './FormatChip'
import { FormatPicker } from './FormatPicker'
import { pickerOptions, isEncodable } from '../../converters/registry'

/**
 * Compact "Convert to → [TARGET]" control, designed to sit as the header of
 * the upload card so the output choice and the drop area read as one unit.
 * The source is auto-detected per file, so the target is the only decision.
 * `onChangeTarget(nextTo)` reports the chosen output format.
 */
export function TargetSelector({ to, onChangeTarget }) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(null)

  const options = pickerOptions(to, 'target')

  const handleSelect = (next) => {
    if (isEncodable(next)) onChangeTarget?.(next)
  }

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
        onSelect={handleSelect}
      />
    </Box>
  )
}
