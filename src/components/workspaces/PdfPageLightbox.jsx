import { useState, useEffect } from 'react'
import { Box, Dialog, IconButton, CircularProgress } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { renderPdfPage } from '../../converters/pdfConverters'

/**
 * A shared lightbox for previewing a single PDF page at readable size. Open it
 * by passing a `page` object; pass `null` to close.
 *
 * `page`: { file, page (1-based), width, height, rotate? } — `width`/`height`
 * give the thumbnail's pixel size (aspect ratio); `rotate` (optional) shows the
 * page turned. `label` is the caption/alt text.
 *
 * It renders the given page at high resolution on demand for a crisp view,
 * showing the (soft) thumbnail `thumbUrl` with a spinner until the crisp render
 * lands. The display box is sized from the page's aspect ratio and capped to
 * the viewport, so swapping thumbnail → hi-res changes only sharpness, never
 * geometry (no second "zoom").
 */
export function PdfPageLightbox({ page, thumbUrl, label, onClose }) {
  const [hiRes, setHiRes] = useState(null)

  // Render the open page at high resolution; revoke when it closes/changes.
  useEffect(() => {
    if (!page) return
    let url
    let cancelled = false
    renderPdfPage(page.file, page.page)
      .then((res) => {
        if (cancelled) {
          URL.revokeObjectURL(res.url)
          return
        }
        url = res.url
        setHiRes(url)
      })
      .catch(() => {
        /* fall back to the thumbnail already shown */
      })
    return () => {
      cancelled = true
      setHiRes(null)
      if (url) URL.revokeObjectURL(url)
    }
    // Re-render only when the target page identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.file, page?.page])

  const rotate = page?.rotate ?? 0
  const sideways = rotate % 180 !== 0
  const ar = (page?.width ?? 1) / (page?.height ?? 1)

  return (
    <Dialog
      open={Boolean(page)}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            // Strip the default Paper chrome (glass fill, 1px border, blur, and
            // its 22px rounding). Otherwise that rounded outline sits around the
            // white page box with a DIFFERENT radius, and the corners visibly
            // don't line up. Here the page box itself is the only rounded frame.
            bgcolor: 'transparent',
            boxShadow: 'none',
            border: 'none',
            borderRadius: 0,
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            m: { xs: 1, md: 3 },
            overflow: 'visible',
            maxWidth: 'none',
            maxHeight: 'none',
          },
        },
      }}
    >
      {page && (
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <IconButton
            onClick={onClose}
            aria-label="Close preview"
            sx={{
              position: 'absolute',
              top: -14,
              right: -14,
              zIndex: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: (t) => t.morph.sticker.shadow,
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>

          <Box
            sx={{
              position: 'relative',
              aspectRatio: `${ar}`,
              maxWidth: sideways ? '90vh' : '94vw',
              maxHeight: sideways ? '94vw' : '90vh',
              width: sideways ? undefined : `min(94vw, calc(90vh * ${ar}))`,
              height: sideways ? `min(94vw, calc(90vh / ${ar}))` : undefined,
              bgcolor: '#fff',
              boxShadow: (t) => t.morph.sticker.shadowHover,
              // The page fills this box edge-to-edge, so the rounding + clip live
              // right here and curve the page's own corners. A modest radius only
              // trims the page's blank corner margin, so no content is lost.
              borderRadius: 2,
              overflow: 'hidden',
              transform: `rotate(${rotate}deg)`,
              transition: 'transform 220ms cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            <Box
              component="img"
              src={hiRes ?? thumbUrl}
              alt={label ?? 'PDF page enlarged'}
              sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {!hiRes && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.35)',
                }}
              >
                <CircularProgress size={28} />
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Dialog>
  )
}
