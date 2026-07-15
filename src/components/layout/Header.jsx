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
  convertItemToConversion,
} from '../../config/conversions'
import { hrefForSelection } from '../../config/routing'
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

// The sticker swatch each nav section wears when active, so the highlighted tab
// reads as a placed pastel sticker in the site's palette.
const SECTION_STICKER = { convert: 'blue', merge: 'lilac', compress: 'mint' }

function NavItem({ label, open, active, sticker, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-current={active ? 'page' : undefined}
      sx={(theme) => {
        const s = theme.morph.sticker
        return {
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          pl: active ? 1.5 : 1,
          pr: active ? 1.25 : 1,
          py: 0.5,
          borderRadius: 999,
          fontSize: 22,
          fontWeight: 700,
          color: 'text.primary',
          // Active: a placed pastel sticker — swatch fill, die-cut peel border,
          // soft shadow, slight lift. Inactive: bare text, dimmed.
          bgcolor: active ? theme.morph.stickers[sticker] : 'transparent',
          border: `2px solid ${active ? s.peel : 'transparent'}`,
          boxShadow: active ? s.shadow : 'none',
          opacity: active ? 1 : 0.7,
          transform: active ? 'translateY(-1px)' : 'none',
          transition:
            'transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 140ms ease, background-color 180ms ease, box-shadow 180ms ease',
          '&:hover': {
            opacity: 1,
            transform: 'translateY(-2px)',
            boxShadow: active ? s.shadowHover : 'none',
          },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }
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
    getHref: (item) => hrefForSelection('convert', convertItemToConversion(item)),
  },
  compress: {
    categories: COMPRESS_MENU,
    getItems: compressMenuItems,
    renderLabel: (item) => item.label,
    getSticker: (item) => compressItemSticker(item),
    getHref: (item) => hrefForSelection('compress', { format: item.format }),
  },
  merge: {
    categories: MERGE_MENU,
    getItems: (c) => c.items,
    renderLabel: (item) => item.label,
    getHref: (item) => hrefForSelection('merge', { op: item.op }),
  },
}

/**
 * Top app bar: logo, the three nav sections (each opens a categorized mega
 * menu), and the theme toggle. Selecting an item calls the matching handler,
 * which switches the app's active mode + selection.
 */
export function Header({ mode, onSelectConvert, onSelectCompress, onSelectMerge, onGoHome }) {
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
      <Logo onGoHome={onGoHome} />

      <Stack
        component="nav"
        aria-label="Tools"
        direction="row"
        spacing={{ xs: 1, md: 2 }}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        {NAV_SECTIONS.map((section) => (
          <NavItem
            key={section}
            label={section}
            active={mode === section}
            sticker={SECTION_STICKER[section]}
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
            getHref={cfg.getHref}
            onSelect={handlers[section]}
          />
        )
      })}
    </Box>
  )
}
