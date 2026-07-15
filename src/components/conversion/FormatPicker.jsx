import { Menu, MenuItem, Box, Typography } from '@mui/material'
import { getFormat } from '../../config/conversions'

/** Small sticker swatch shown beside each format option. */
function Swatch({ formatId }) {
  const format = getFormat(formatId)
  return (
    <Box
      sx={(theme) => ({
        width: 22,
        height: 22,
        borderRadius: '7px',
        bgcolor: theme.morph.stickers[format.sticker],
        border: `2px solid ${theme.morph.sticker.peel}`,
        flexShrink: 0,
      })}
    />
  )
}

/**
 * Dropdown to pick a format. `options` is a list of { id } — only pickable
 * (for a target picker, only encodable) formats are included, so there are no
 * dead/disabled entries.
 */
export function FormatPicker({ anchorEl, open, onClose, options, onSelect }) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{ list: { sx: { py: 0.5, minWidth: 160 } } }}
    >
      {options.map(({ id }) => (
        <MenuItem
          key={id}
          onClick={() => {
            onSelect(id)
            onClose()
          }}
          sx={{ gap: 1.5, py: 1, borderRadius: 2, mx: 0.5 }}
        >
          <Swatch formatId={id} />
          <Typography sx={{ fontWeight: 600, flex: 1, color: 'text.primary' }}>{id}</Typography>
        </MenuItem>
      ))}
    </Menu>
  )
}
