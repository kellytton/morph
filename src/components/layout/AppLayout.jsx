import { Box } from '@mui/material'
import { Header } from './Header'
import { Footer } from './Footer'
import { StarField } from '../decor/StarField'

/**
 * App frame: sticky header over a centered, max-width content column, atop a
 * decorative StarField background layer. Children receive the full page area
 * below the header.
 */
export function AppLayout({
  mode,
  onSelectConvert,
  onSelectCompress,
  onSelectMerge,
  children,
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        color: 'text.primary',
        transition: 'background-color 240ms ease, color 240ms ease',
      }}
    >
      <StarField />
      {/* Header is position: sticky, so it must be a direct child of this
          scrolling column (not wrapped in another positioned box, which would
          trap the stick within that box's height). It sets its own z-index. */}
      <Header
        mode={mode}
        onSelectConvert={onSelectConvert}
        onSelectCompress={onSelectCompress}
        onSelectMerge={onSelectMerge}
      />
      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          width: '100%',
          maxWidth: 1080,
          mx: 'auto',
          px: { xs: 2, md: 4 },
        }}
      >
        {children}
      </Box>
      {/* Footer spans full width below the centered content column. */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Footer />
      </Box>
    </Box>
  )
}
