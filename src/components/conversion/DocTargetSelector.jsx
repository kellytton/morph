import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { FormatChip } from './FormatChip'
import { FormatPicker } from './FormatPicker'

// Document conversion targets: render a PDF to images, or build a PDF from
// images. Kept to the three we support client-side.
const DOC_TARGETS = ['png', 'jpg', 'pdf']

/**
 * "Convert to → [TARGET]" control for the document workspace. Choosing PNG/JPG
 * puts us in PDF→images mode; choosing PDF puts us in images→PDF mode.
 */
export function DocTargetSelector({ to, onChangeTarget }) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(null)

  const options = DOC_TARGETS.filter((id) => id !== to).map((id) => ({ id }))

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
        onSelect={(next) => {
          // Keep the document intent: rendering a PDF (→ png/jpg) means the
          // source is pdf; building a PDF (→ pdf) means the source is an image.
          const from = next === 'pdf' ? 'png' : 'pdf'
          onChangeTarget?.(next, from)
        }}
      />
    </Box>
  )
}
