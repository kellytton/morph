import { useEffect, useState } from 'react'
import { Box, Dialog, IconButton, Typography, Stack } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { formatBytes } from '../../utils/format'

// Create an object URL for a blob/file and revoke it on change/unmount. Returns
// null for non-image blobs (e.g. a PDF result can't be shown as an <img>).
function useImageUrl(blob) {
  const isImage = Boolean(blob && blob.type?.startsWith('image/'))
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!isImage) return undefined
    const u = URL.createObjectURL(blob)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URLs must be created in an effect for correct revoke pairing
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob, isImage])
  // Gate on isImage so a stale URL from a previous (image) blob isn't shown for
  // a non-image one.
  return isImage ? url : null
}

// One labelled panel: the image on a checkerboard (so transparency reads),
// with a caption underneath.
function Panel({ url, label, caption, dims }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'text.secondary' }}>{label}</Typography>
      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: (t) => t.morph.sticker.shadowHover,
          // Checkerboard so transparent PNGs/WebPs are legible.
          backgroundColor: '#fff',
          backgroundImage:
            'linear-gradient(45deg, #e9e9e9 25%, transparent 25%), linear-gradient(-45deg, #e9e9e9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e9e9e9 75%), linear-gradient(-45deg, transparent 75%, #e9e9e9 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
        }}
      >
        {url ? (
          <Box
            component="img"
            src={url}
            alt={label}
            sx={{
              display: 'block',
              // Stacked (xs): use most of the width, each capped to ~40% height
              // so both panels fit. Side-by-side (md+): ~44vw each, tall.
              maxWidth: { xs: '90vw', md: '44vw' },
              maxHeight: { xs: '40vh', md: '78vh' },
              objectFit: 'contain',
            }}
          />
        ) : (
          <Box
            sx={{
              width: { xs: '86vw', md: 'min(44vw, 320px)' },
              height: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              fontWeight: 600,
              px: 2,
              textAlign: 'center',
            }}
          >
            No image preview
          </Box>
        )}
      </Box>
      {caption && (
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          {caption}
          {dims ? <Box component="span" sx={{ opacity: 0.7, fontWeight: 500 }}>{`  ·  ${dims}`}</Box> : null}
        </Typography>
      )}
    </Box>
  )
}

/**
 * A lightbox that shows a queue item's SOURCE and RESULT side-by-side so the
 * quality/size trade-off is easy to judge. Before the item finishes (or when
 * the result isn't an image, e.g. a PDF), it shows the source alone.
 *
 * `item` is the queue item (or null to close). `onClose` closes it.
 */
export function ImageCompareLightbox({ item, onClose }) {
  const sourceUrl = useImageUrl(item?.file)
  const resultUrl = useImageUrl(item?.result?.blob)
  const hasResult = Boolean(item?.result && resultUrl)

  return (
    <Dialog
      open={Boolean(item)}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
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
      {item && (
        <Box sx={{ position: 'relative' }}>
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

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 2, md: 3 }}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              // If the stacked panels are taller than the screen, scroll rather
              // than clip behind the (overflow-visible) dialog paper.
              maxHeight: { xs: '92vh', md: 'none' },
              overflowY: { xs: 'auto', md: 'visible' },
              py: { xs: 1, md: 0 },
            }}
          >
            <Panel
              url={sourceUrl}
              label={hasResult ? 'Original' : 'Preview'}
              caption={`${item.from?.toUpperCase() ?? ''} · ${formatBytes(item.file.size)}`}
            />
            {hasResult && (
              <Panel
                url={resultUrl}
                label={item.mode === 'compress' ? 'Optimized' : `Converted → ${item.to?.toUpperCase()}`}
                caption={formatBytes(item.result.size)}
                dims={item.result.width > 0 ? `${item.result.width}×${item.result.height}` : null}
              />
            )}
          </Stack>
        </Box>
      )}
    </Dialog>
  )
}
