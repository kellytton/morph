import { useState, useEffect } from 'react'
import { Box, Stack, ButtonBase } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded'
import ArrowDropUpRoundedIcon from '@mui/icons-material/ArrowDropUpRounded'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { NavMenu } from './NavMenu'
import { MobileNav } from './MobileNav'
import {
  NAV_SECTIONS,
  CONVERSION_MENU,
  COMPRESS_MENU,
  MERGE_MENU,
  convertItemLabel,
  convertItemSticker,
  compressItemSticker,
} from '../../config/conversions'
import { isEncodable, isMediaFormat } from '../../converters/registry'

// A plain image-target convert item (e.g. { target: 'avif' }) is only usable if
// this browser can actually encode it — otherwise it would dead-end on a
// "coming soon" panel. Filter those out so the menu never offers an option the
// browser can't fulfil. Document items (doc:true) and media targets route to
// other workspaces and are always kept.
function convertMenuItems(category) {
  return category.items.filter((item) => {
    if (item.doc || !item.target || isMediaFormat(item.target)) return true
    return isEncodable(item.target)
  })
}

// Same idea for compress: drop an image format this browser can't re-encode
// (e.g. AVIF on older Safari) so it never dead-ends. Media formats are kept.
function compressMenuItems(category) {
  return category.items.filter(
    (item) => isMediaFormat(item.format) || isEncodable(item.format),
  )
}

function NavItem({ label, open, active, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={open}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 1,
        py: 0.5,
        borderRadius: 2,
        fontSize: 22,
        fontWeight: 700,
        color: 'text.primary',
        opacity: active ? 1 : 0.7,
        transition: 'transform 140ms ease, opacity 140ms ease',
        '&:hover': { transform: 'translateY(-1px)', opacity: 1 },
      }}
    >
      {label}
      {open ? (
        <ArrowDropUpRoundedIcon fontSize="small" />
      ) : (
        <ArrowDropDownRoundedIcon fontSize="small" />
      )}
    </ButtonBase>
  )
}

// Per-section menu wiring: config + how to render/label each item. `getSticker`
// (optional) returns a sticker swatch key to show beside the item.
const SECTION_MENUS = {
  convert: {
    categories: CONVERSION_MENU,
    getItems: convertMenuItems,
    renderLabel: (item) => convertItemLabel(item),
    getSticker: (item) => convertItemSticker(item),
  },
  compress: {
    categories: COMPRESS_MENU,
    getItems: compressMenuItems,
    renderLabel: (item) => item.label,
    getSticker: (item) => compressItemSticker(item),
  },
  merge: {
    categories: MERGE_MENU,
    getItems: (c) => c.items,
    renderLabel: (item) => item.label,
  },
}

/**
 * Top app bar: logo, the three nav sections (each opens a categorized mega
 * menu), and the theme toggle. Selecting an item calls the matching handler,
 * which switches the app's active mode + selection.
 */
export function Header({ mode, onSelectConvert, onSelectCompress, onSelectMerge }) {
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [openSection, setOpenSection] = useState(null)
  // Once the page scrolls a little, the sticky bar gains its frosted-glass
  // backing so content reads cleanly beneath it; at the very top it stays
  // transparent so the hero isn't covered by a heavy band.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll() // sync on mount (e.g. restored scroll position)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (section) => (e) => {
    if (openSection === section) {
      setOpenSection(null)
      setMenuAnchor(null)
    } else {
      setOpenSection(section)
      setMenuAnchor(e.currentTarget)
    }
  }

  const closeMenu = () => {
    setOpenSection(null)
    setMenuAnchor(null)
  }

  const handlers = {
    convert: onSelectConvert,
    compress: onSelectCompress,
    merge: onSelectMerge,
  }

  return (
    <Box
      component="header"
      sx={(theme) => ({
        position: 'sticky',
        top: 0,
        zIndex: theme.zIndex.appBar,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 2, md: 4 },
        px: { xs: 2, md: 4 },
        py: 2.5,
        // Frosted-glass backing that fades in once scrolled; transparent at the
        // top so it floats over the hero. Light mode gets a MORE translucent
        // fill + stronger blur: white-on-cream is low contrast, so the card's
        // 0.7-opacity glass reads as a near-solid bar — dialing the surface down
        // to ~0.5 lets the blur/stars actually show through, so it looks like
        // glass (as dark mode already does).
        backgroundColor: scrolled
          ? theme.palette.mode === 'light'
            ? alpha(theme.palette.background.default, 0.62)
            : theme.morph.glass.bg
          : 'transparent',
        backdropFilter: scrolled
          ? theme.palette.mode === 'light'
            ? 'blur(18px) saturate(1.8)'
            : theme.morph.glass.blur
          : 'none',
        WebkitBackdropFilter: scrolled
          ? theme.palette.mode === 'light'
            ? 'blur(18px) saturate(1.8)'
            : theme.morph.glass.blur
          : 'none',
        borderBottom: '1px solid',
        borderColor: scrolled ? 'divider' : 'transparent',
        boxShadow: scrolled ? theme.morph.glass.shadow : 'none',
        transition:
          'background-color 240ms ease, box-shadow 240ms ease, border-color 240ms ease, backdrop-filter 240ms ease',
      })}
    >
      <Logo />

      <Stack
        direction="row"
        spacing={{ xs: 1, md: 2 }}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        {NAV_SECTIONS.map((section) => (
          <NavItem
            key={section}
            label={section}
            active={mode === section}
            open={openSection === section}
            onClick={handleNavClick(section)}
          />
        ))}
      </Stack>

      <Box sx={{ flex: 1 }} />
      <ThemeToggle />

      {/* Mobile: hamburger drawer with the same sections. */}
      <MobileNav
        mode={mode}
        sections={NAV_SECTIONS}
        sectionMenus={SECTION_MENUS}
        handlers={handlers}
      />

      {NAV_SECTIONS.map((section) => {
        const cfg = SECTION_MENUS[section]
        return (
          <NavMenu
            key={section}
            anchorEl={menuAnchor}
            open={openSection === section}
            onClose={closeMenu}
            categories={cfg.categories}
            getItems={cfg.getItems}
            renderLabel={cfg.renderLabel}
            getSticker={cfg.getSticker}
            onSelect={handlers[section]}
          />
        )
      })}
    </Box>
  )
}
