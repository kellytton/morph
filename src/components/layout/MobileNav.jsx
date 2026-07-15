import { useState } from 'react'
import {
  Box,
  IconButton,
  Drawer,
  Typography,
  ButtonBase,
  Collapse,
  Divider,
} from '@mui/material'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

function Swatch({ colorKey }) {
  if (!colorKey) return null
  return (
    <Box
      sx={(theme) => ({
        width: 16,
        height: 16,
        borderRadius: '5px',
        flexShrink: 0,
        bgcolor: theme.morph.stickers[colorKey],
        border: `1.5px solid ${theme.morph.sticker.peel}`,
      })}
    />
  )
}

/**
 * Mobile navigation: a hamburger button (shown below the `sm` breakpoint)
 * that opens a drawer. Each of the three sections is an expandable accordion
 * listing its categorized options, reusing the same config + handlers as the
 * desktop menus.
 */
export function MobileNav({ mode, sections, sectionMenus, handlers }) {
  const [open, setOpen] = useState(false)
  // Which section accordion is expanded; default to the active mode.
  const [expanded, setExpanded] = useState(mode)

  // Sync the expanded accordion to the current mode when the drawer opens, so
  // reopening after a mode change shows the section you're actually in.
  const openDrawer = () => {
    setExpanded(mode)
    setOpen(true)
  }
  const close = () => setOpen(false)

  const handleSelect = (section) => (item) => {
    handlers[section]?.(item)
    close()
  }

  return (
    <Box sx={{ display: { xs: 'flex', sm: 'none' } }}>
      <IconButton
        aria-label="Open navigation menu"
        onClick={openDrawer}
        sx={{ color: 'text.primary' }}
      >
        <MenuRoundedIcon />
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        slotProps={{
          paper: {
            sx: {
              width: 'min(86vw, 340px)',
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              p: 2,
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, flex: 1 }}>Menu</Typography>
          <IconButton aria-label="Close menu" onClick={close} sx={{ color: 'text.primary' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        {sections.map((section) => {
          const cfg = sectionMenus[section]
          const isOpen = expanded === section
          return (
            <Box key={section}>
              <ButtonBase
                onClick={() => setExpanded(isOpen ? null : section)}
                aria-expanded={isOpen}
                sx={{
                  width: '100%',
                  justifyContent: 'space-between',
                  px: 1,
                  py: 1.25,
                  borderRadius: 2,
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'text.primary',
                  opacity: mode === section ? 1 : 0.85,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {section}
                <ExpandMoreRoundedIcon
                  sx={{
                    transition: 'transform 200ms ease',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                  }}
                />
              </ButtonBase>

              <Collapse in={isOpen} unmountOnExit>
                <Box sx={{ pb: 1 }}>
                  {cfg.categories.map((category) => (
                    <Box key={category.id} sx={{ mb: 1 }}>
                      <Typography
                        sx={{
                          px: 1,
                          pt: 0.5,
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {category.label}
                      </Typography>
                      {cfg.getItems(category).map((item, idx) => (
                        <ButtonBase
                          key={idx}
                          onClick={() => handleSelect(section)(item)}
                          sx={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            gap: 1,
                            pl: 2,
                            pr: 1,
                            py: 0.75,
                            borderRadius: 2,
                            fontSize: 15,
                            fontWeight: 500,
                            color: 'text.primary',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <Swatch colorKey={cfg.getSticker?.(item)} />
                          {cfg.renderLabel(item)}
                        </ButtonBase>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Collapse>
              <Divider sx={{ my: 0.5, opacity: 0.5 }} />
            </Box>
          )
        })}
      </Drawer>
    </Box>
  )
}
