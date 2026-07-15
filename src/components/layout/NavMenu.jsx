import { Box, Menu, Typography, ButtonBase } from '@mui/material'

/** A category heading with a leading rule, matching the convert menu. */
function CategoryHeading({ children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, mt: 0.5 }}>
      <Box sx={{ width: 40, height: 2, bgcolor: 'text.primary', borderRadius: 1 }} />
      <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{children}</Typography>
    </Box>
  )
}

function Swatch({ colorKey }) {
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

function MenuOption({ label, sticker, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        justifyContent: 'flex-start',
        gap: 1,
        width: '100%',
        px: 1,
        py: 0.5,
        borderRadius: 2,
        fontSize: 15,
        fontWeight: 500,
        color: 'text.primary',
        transition: 'background-color 120ms ease, transform 120ms ease',
        '&:hover': { bgcolor: 'action.hover', transform: 'translateX(2px)' },
      }}
    >
      {sticker && <Swatch colorKey={sticker} />}
      {label}
    </ButtonBase>
  )
}

/**
 * Reusable categorized mega-menu shared by convert / compress / merge.
 *
 * `categories`: [{ id, label, items: [...] }]
 * `getItems(category)`: returns the item array (menus name it differently)
 * `renderLabel(item)`: string label for an item
 * `onSelect(item)`: called with the chosen item
 *
 * Categories are split into two visual columns to match the design.
 */
export function NavMenu({
  anchorEl,
  open,
  onClose,
  categories,
  getItems,
  renderLabel,
  getSticker,
  onSelect,
}) {
  const handleSelect = (item) => {
    onSelect?.(item)
    onClose?.()
  }

  // Only split into two columns when there's more than one category. A
  // single-category menu (e.g. merge) stays one column so it hugs its content
  // instead of stretching across an empty second column.
  const twoCol = categories.length > 1
  const mid = Math.ceil(categories.length / 2)
  const columns = twoCol ? [categories.slice(0, mid), categories.slice(mid)] : [categories]

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ list: { sx: { py: 0 } } }}
    >
      <Box
        sx={{
          display: 'grid',
          // One column when there's a single category; otherwise two on sm+.
          gridTemplateColumns: twoCol ? { xs: '1fr', sm: '1fr 1fr' } : '1fr',
          gap: { xs: 2, sm: 5 },
          p: 3,
          // Right-size to content: a narrow floor for single-category menus,
          // wider for the two-column layout. Width now follows the items.
          minWidth: twoCol ? { xs: 240, sm: 440 } : 220,
          maxWidth: '90vw',
        }}
      >
        {columns.map((column, i) => (
          <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {column.map((category) => (
              <Box key={category.id}>
                <CategoryHeading>{category.label}</CategoryHeading>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {getItems(category).map((item, idx) => (
                    <MenuOption
                      key={idx}
                      label={renderLabel(item)}
                      sticker={getSticker?.(item)}
                      onClick={() => handleSelect(item)}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Menu>
  )
}
