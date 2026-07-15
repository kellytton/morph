import { useState } from 'react'
import { Box, ButtonBase, Collapse, Typography } from '@mui/material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

/**
 * An unobtrusive "Advanced options" disclosure. Keeps a flow clean by default
 * while making power controls one tap away. `children` render inside when open.
 */
export function AdvancedOptions({ label = 'Advanced options', defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Box>
      <ButtonBase
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          borderRadius: 999,
          color: 'text.secondary',
          fontWeight: 600,
          fontSize: 14,
          transition: 'color 140ms ease, background-color 140ms ease',
          '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
        }}
      >
        <TuneRoundedIcon sx={{ fontSize: 18 }} />
        <Typography component="span" sx={{ fontWeight: 600, fontSize: 14 }}>
          {label}
        </Typography>
        <ExpandMoreRoundedIcon
          sx={{
            fontSize: 18,
            transition: 'transform 200ms ease',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </ButtonBase>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 1.5 }}>{children}</Box>
      </Collapse>
    </Box>
  )
}
