import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import RotateRightRoundedIcon from '@mui/icons-material/RotateRightRounded'
import RotateLeftRoundedIcon from '@mui/icons-material/RotateLeftRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import { pdfThumbnails } from '../../converters/pdfConverters'
import { useFlipReorder } from '../../hooks/useFlipReorder'
import { PdfPageLightbox } from './PdfPageLightbox'

let pageUid = 0

/**
 * A single page tile: thumbnail (rotated live via CSS), position badge, and
 * the reorder / rotate / delete controls.
 */
function PageTile({ page, index, total, onMove, onRotate, onDelete, onExpand }) {
  return (
    <Paper
      data-flip-id={page.id}
      sx={(t) => ({
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        // Compact tile: a tighter corner than the default panel radius, so the
        // coloured top accent and inner preview sit flush instead of getting
        // sliced by an over-round corner. Clip the accent to the rounding.
        borderRadius: '16px',
        overflow: 'hidden',
        borderTop: `5px solid ${t.morph.stickers.lilac}`,
        willChange: 'transform',
      })}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-label={`Expand page ${index + 1}`}
        onClick={() => onExpand(page)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onExpand(page)
          }
        }}
        sx={{
          position: 'relative',
          // Taller, readable previews — roughly page-proportioned. Full width on
          // mobile (one per row), still generous in the multi-column layout.
          height: { xs: 440, sm: 340, md: 300 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          // Concentric with the card: inner radius = outer (16) − padding (8).
          borderRadius: '8px',
          overflow: 'hidden',
          cursor: 'zoom-in',
          outline: 'none',
          '& .zoom-hint': { opacity: 0 },
          '@media (hover: hover)': {
            '&:hover .zoom-hint': { opacity: 1 },
          },
          '&:focus-visible': { boxShadow: (t) => `inset 0 0 0 2px ${t.palette.primary.main}` },
        }}
      >
        <Box
          component="img"
          src={page.url}
          alt={`Page ${index + 1}`}
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `rotate(${page.rotate}deg)`,
            transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            minWidth: 22,
            height: 22,
            px: 0.5,
            borderRadius: '7px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {index + 1}
        </Box>
        <Box
          className="zoom-hint"
          aria-hidden
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 26,
            height: 26,
            borderRadius: '8px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 160ms ease',
          }}
        >
          <ZoomInRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        </Box>
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Tooltip title="Move left">
            <span>
              <IconButton size="small" disabled={index === 0} onClick={() => onMove(index, -1)}>
                <ArrowBackRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move right">
            <span>
              <IconButton
                size="small"
                disabled={index === total - 1}
                onClick={() => onMove(index, 1)}
              >
                <ArrowForwardRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Rotate left">
            <IconButton size="small" onClick={() => onRotate(page.id, -90)}>
              <RotateLeftRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotate right">
            <IconButton size="small" onClick={() => onRotate(page.id, 90)}>
              <RotateRightRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete page">
            <IconButton size="small" onClick={() => onDelete(page.id)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
    </Paper>
  )
}

/**
 * A reusable page-level editor: renders every page of the given PDF files as
 * thumbnails in a responsive grid, and lets the user reorder, rotate, and
 * delete individual pages across all of them.
 *
 * Files are supplied via the `files` prop (an ordered array of File objects).
 * When it changes, pages are (re)loaded. The parent reads the current page
 * arrangement via the imperative ref: `ref.current.getPages()` returns
 * [{ file, page, rotate }] ready for `editPdfPages`. `onError`/`onLoadingChange`
 * surface async state to the host workspace.
 *
 * Shared by the Edit-PDF-pages workspace and the Merge workspace's
 * "rearrange pages" mode.
 */
export const PdfPageEditor = forwardRef(function PdfPageEditor(
  { files, onError, onLoadingChange, onCountChange },
  ref,
) {
  // Each page: { id, file, page (1-based in source), rotate, url }.
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(false)
  // The page currently shown enlarged in the lightbox (id), or null.
  const [expandedId, setExpandedId] = useState(null)

  // Track object URLs so we can revoke them on unmount. Mutated in place
  // (never reassigned), so the reference captured at mount sees every push.
  const urlsRef = useRef([])
  useEffect(() => {
    const urls = urlsRef.current
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  // Slide tiles to their new spots when pages are reordered (no snap). Loading
  // or deleting pages changes membership, so those settle without animating.
  const gridRef = useRef(null)
  useFlipReorder(gridRef, pages.map((p) => p.id))

  useImperativeHandle(
    ref,
    () => ({
      getPages: () => pages.map((p) => ({ file: p.file, page: p.page, rotate: p.rotate })),
      count: pages.length,
    }),
    [pages],
  )

  // Keep the host workspace's page count in sync (for its header + Save button).
  useEffect(() => {
    onCountChange?.(pages.length)
  }, [pages.length, onCountChange])

  // (Re)load thumbnails whenever the incoming file set changes. Pages already
  // shown for files still present are kept (preserving edits); pages for
  // removed files are dropped, and newly added files are appended.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const wanted = files ?? []
      // Drop pages whose source file is no longer in the set.
      setPages((prev) => prev.filter((p) => wanted.includes(p.file)))

      const known = new Set(pages.map((p) => p.file))
      const toLoad = wanted.filter((f) => !known.has(f))
      if (!toLoad.length) return

      setLoading(true)
      onLoadingChange?.(true)
      try {
        for (const file of toLoad) {
          const thumbs = await pdfThumbnails(file)
          if (cancelled) return
          thumbs.forEach((t) => urlsRef.current.push(t.url))
          setPages((prev) => [
            ...prev,
            ...thumbs.map((t) => ({
              id: `p${++pageUid}`,
              file,
              page: t.page,
              rotate: 0,
              url: t.url,
              width: t.width,
              height: t.height,
            })),
          ])
        }
      } catch (e) {
        if (!cancelled) onError?.(e?.message ?? 'Could not read that PDF.')
      } finally {
        if (!cancelled) {
          setLoading(false)
          onLoadingChange?.(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // Reload only when the set of files changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  const move = useCallback(
    (index, dir) =>
      setPages((prev) => {
        const next = [...prev]
        const j = index + dir
        if (j < 0 || j >= next.length) return prev
        ;[next[index], next[j]] = [next[j], next[index]]
        return next
      }),
    [],
  )

  const rotate = useCallback(
    (id, delta) =>
      setPages((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, rotate: ((p.rotate + delta) % 360 + 360) % 360 } : p,
        ),
      ),
    [],
  )

  const remove = useCallback((id) => {
    // Close the lightbox if the page it's showing is the one being removed.
    setExpandedId((cur) => (cur === id ? null : cur))
    setPages((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const expanded = pages.find((p) => p.id === expandedId) ?? null
  const expandedIndex = expanded ? pages.indexOf(expanded) : -1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {loading && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 1 }}>
          <CircularProgress size={18} />
          <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Rendering page thumbnails…
          </Typography>
        </Stack>
      )}

      {pages.length > 0 && (
        <Box
          ref={gridRef}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 1.5,
          }}
        >
          {pages.map((page, i) => (
            <PageTile
              key={page.id}
              page={page}
              index={i}
              total={pages.length}
              onMove={move}
              onRotate={rotate}
              onDelete={remove}
              onExpand={(p) => setExpandedId(p.id)}
            />
          ))}
        </Box>
      )}

      {/* Click a page to see it enlarged (high-res), still live-rotated. */}
      <PdfPageLightbox
        page={expanded}
        thumbUrl={expanded?.url}
        label={expanded ? `Page ${expandedIndex + 1} enlarged` : undefined}
        onClose={() => setExpandedId(null)}
      />
    </Box>
  )
})
