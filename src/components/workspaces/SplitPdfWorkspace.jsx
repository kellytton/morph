import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box,
  Fade,
  Paper,
  Typography,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import CallSplitRoundedIcon from '@mui/icons-material/CallSplitRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { UploadZone } from '../upload/UploadZone'
import { MergeWorkspaceHeader } from './MergeWorkspaceHeader'
import { StickerToggle } from '../common/StickerToggle'
import { StickerButton } from '../common/StickerButton'
import { PdfPageLightbox } from './PdfPageLightbox'
import { pdfThumbnails, splitPdf } from '../../converters/pdfConverters'
import { downloadZip } from '../../utils/download'
import { formatBytes } from '../../utils/format'

// Cycle of sticker swatches used to colour-code each output file.
const GROUP_COLORS = ['blue', 'mint', 'peach', 'lilac', 'pink', 'lemon']

// A→Z labels for the output files ("File A", "File B", …).
function fileLabel(i) {
  return String.fromCharCode(65 + (i % 26)) + (i >= 26 ? String(Math.floor(i / 26)) : '')
}

/**
 * Turn a set of cut positions into { from, to } page groups. A cut at index `i`
 * means a break AFTER page (i + 1) — i.e. between pages i+1 and i+2. `total` is
 * the page count. Returns 1-based inclusive ranges.
 */
function cutsToGroups(cuts, total) {
  const sorted = [...cuts].sort((a, b) => a - b)
  const groups = []
  let start = 1
  for (const cut of sorted) {
    groups.push({ from: start, to: cut + 1 })
    start = cut + 2
  }
  groups.push({ from: start, to: total })
  return groups
}

/**
 * Split mode with a visual, scissor-style UI: every page is shown as a
 * thumbnail in a responsive grid, and the user clicks a full-width divider to
 * drop a cut between two pages. Pages are colour-grouped into the output files
 * they'll become, updated live. Click a page to preview it enlarged. Presets
 * offer one-file-per-page and a single (uncut) file; any manual cut reads as
 * "custom". Outputs download as a ZIP.
 */
export function SplitPdfWorkspace() {
  const [file, setFile] = useState(null)
  const [thumbs, setThumbs] = useState([]) // [{ page, url, width, height }]
  const [cuts, setCuts] = useState(new Set()) // cut after page index (0-based)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [expandedPage, setExpandedPage] = useState(null) // page number, or null
  // Cancel just discards the in-flight result (browser work can't truly abort).
  const canceledRef = useRef(false)

  const urlsRef = useRef([])
  useEffect(() => {
    const urls = urlsRef.current
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  const total = thumbs.length
  const groups = useMemo(() => (total ? cutsToGroups(cuts, total) : []), [cuts, total])

  // Which preset the current cut pattern matches, for the toggle.
  const preset =
    total === 0 || cuts.size === 0 ? 'single' : cuts.size === total - 1 ? 'each' : 'custom'

  const loadFile = async (f) => {
    if (!f) return
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    urlsRef.current = []
    setFile(f)
    setCuts(new Set())
    setThumbs([])
    setError(null)
    setExpandedPage(null)
    setLoading(true)
    try {
      const t = await pdfThumbnails(f, { maxEdge: 240 })
      t.forEach((x) => urlsRef.current.push(x.url))
      setThumbs(t)
    } catch (e) {
      setError(e?.message ?? 'Could not read that PDF.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCut = (index) =>
    setCuts((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })

  const applyPreset = (value) => {
    if (value === 'single') setCuts(new Set())
    else if (value === 'each') setCuts(new Set(Array.from({ length: total - 1 }, (_, i) => i)))
    // 'custom' is implicit — reached by clicking dividers, so no-op here.
  }

  // Map each page (1-based) to its group index, for colour-coding.
  const groupOfPage = useMemo(() => {
    const map = new Map()
    groups.forEach((g, gi) => {
      for (let p = g.from; p <= g.to; p++) map.set(p, gi)
    })
    return map
  }, [groups])

  const run = async () => {
    if (!file || !total) return
    setError(null)
    canceledRef.current = false
    setBusy(true)
    try {
      const parts = await splitPdf(file, { ranges: groups })
      if (canceledRef.current) return // canceled — discard
      if (!parts.length) {
        setError('Nothing to split.')
        return
      }
      const base = file.name.replace(/\.pdf$/i, '') || 'document'
      await downloadZip(
        parts.map((p, i) => ({ blob: p.blob, filename: `${base}-${fileLabel(i)}-${p.label}.pdf` })),
        `${base}-split.zip`,
      )
    } catch (e) {
      if (!canceledRef.current) setError(e?.message ?? 'Something went wrong while splitting.')
    } finally {
      setBusy(false)
    }
  }

  const cancel = () => {
    canceledRef.current = true
    setBusy(false)
  }

  const expandedThumb = expandedPage ? thumbs.find((t) => t.page === expandedPage) : null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { xs: 3, md: 6 } }}>
      <MergeWorkspaceHeader
        icon={<CallSplitRoundedIcon sx={{ color: 'text.primary' }} />}
        title="Split PDF"
        subtitle="Click between pages to choose where each new file begins."
      />

      <Fade in timeout={400}>
        <Box>
          <UploadZone
            onFiles={(f) => loadFile(f[0] ?? null)}
            accept="application/pdf"
            hint={file ? 'Drop a different PDF to start over' : 'Drop a PDF to break it into separate files'}
          />
        </Box>
      </Fade>

      {file && (
        <Paper
          sx={(t) => ({
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderLeft: `6px solid ${t.morph.stickers.lilac}`,
          })}
        >
          <DescriptionRoundedIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700 }}>
              {file.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {formatBytes(file.size)}
              {total ? ` · ${total} page${total > 1 ? 's' : ''}` : ''}
            </Typography>
          </Box>
        </Paper>
      )}

      {loading && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 1 }}>
          <CircularProgress size={18} />
          <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Rendering page thumbnails…
          </Typography>
        </Stack>
      )}

      {error && <Alert role="alert" severity="error">{error}</Alert>}

      {total > 0 && (
        <Stack spacing={2}>
          {/* Controls: presets + live output summary + the Split action. */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}
          >
            <StickerToggle
              ariaLabel="Split mode"
              value={preset}
              onChange={applyPreset}
              size="small"
              options={[
                { value: 'single', label: 'Keep as one', sticker: 'lilac' },
                { value: 'each', label: 'Every page', sticker: 'peach' },
                { value: 'custom', label: 'Custom', sticker: 'blue' },
              ]}
            />
            <Chip
              size="small"
              label={`${groups.length} file${groups.length > 1 ? 's' : ''}`}
              sx={{ fontWeight: 700 }}
            />
            <Box sx={{ flex: 1 }} />
            {busy ? (
              <StickerButton
                sticker="peach"
                aria-label="Cancel"
                startIcon={<CloseRoundedIcon sx={{ fontSize: 20 }} />}
                onClick={cancel}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Cancel</Box>
              </StickerButton>
            ) : (
              <StickerButton
                sticker="blue"
                aria-label="Split"
                startIcon={<CallSplitRoundedIcon sx={{ fontSize: 20 }} />}
                disabled={groups.length < 2}
                onClick={run}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Split</Box>
              </StickerButton>
            )}
          </Stack>

          <Typography sx={{ color: 'text.secondary', fontWeight: 500, fontSize: 14 }}>
            {groups.length < 2
              ? 'Click a ✂ divider between two pages to make your first cut.'
              : `Downloads as a ZIP of ${groups.length} PDFs.`}
          </Typography>

          {/* Fully responsive grid: one column on mobile, scaling up to a max
              of FOUR per row on wide screens (a page scanner reads best around
              this density — beyond it tiles get too small and cuts too cramped).
              Each cut divider lives in the GAP between cards: a slim vertical
              seam on desktop (absolutely placed in the right-hand gutter, so it
              never steals a column), and a full-width horizontal split on mobile
              (where it's one card per row). */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 1.5,
              alignItems: 'start',
            }}
          >
            {thumbs.map((t, i) => {
              const gi = groupOfPage.get(t.page) ?? 0
              const color = GROUP_COLORS[gi % GROUP_COLORS.length]
              const isLast = i === total - 1
              return (
                <Box key={`p${t.page}`} sx={{ position: 'relative' }}>
                  <PageThumb
                    thumb={t}
                    index={i}
                    color={color}
                    groupStart={i === 0 || cuts.has(i - 1)}
                    groupLabel={fileLabel(gi)}
                    onExpand={() => setExpandedPage(t.page)}
                  />
                  {!isLast && (
                    <CutDivider
                      active={cuts.has(i)}
                      onClick={() => toggleCut(i)}
                      between={[t.page, t.page + 1]}
                    />
                  )}
                </Box>
              )
            })}
          </Box>
        </Stack>
      )}

      <PdfPageLightbox
        page={expandedThumb ? { ...expandedThumb, file } : null}
        thumbUrl={expandedThumb?.url}
        label={expandedThumb ? `Page ${expandedThumb.page} enlarged` : undefined}
        onClose={() => setExpandedPage(null)}
      />
    </Box>
  )
}

// A single page thumbnail, tinted by its output group, clickable to expand.
function PageThumb({ thumb, index, color, groupStart, groupLabel, onExpand }) {
  return (
    <Paper
      sx={(t) => ({
        // Fill the grid cell — the parent grid controls how many per row.
        width: '100%',
        p: 0.75,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        // Compact tile: tighter corner than the default panel radius, with the
        // coloured top accent clipped to the rounding so nothing gets sliced.
        borderRadius: '16px',
        overflow: 'hidden',
        borderTop: `5px solid ${t.morph.stickers[color]}`,
      })}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-label={`Expand page ${index + 1}`}
        onClick={onExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onExpand()
          }
        }}
        sx={{
          position: 'relative',
          height: { xs: 360, sm: 195, md: 218 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          // Concentric with the card: inner radius = outer (16) − padding (6).
          borderRadius: '10px',
          overflow: 'hidden',
          cursor: 'zoom-in',
          outline: 'none',
          '& .zoom-hint': { opacity: 0 },
          '@media (hover: hover)': { '&:hover .zoom-hint': { opacity: 1 } },
          '&:focus-visible': {
            outline: (t) => `3px solid ${t.palette.primary.main}`,
            outlineOffset: '2px',
          },
        }}
      >
        <Box
          component="img"
          src={thumb.url}
          alt={`Page ${index + 1}`}
          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            minWidth: 22,
            height: 22,
            px: 0.5,
            borderRadius: '6px',
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
        <Box
          sx={(t) => ({
            position: 'absolute',
            bottom: 4,
            right: 4,
            px: 0.75,
            height: 20,
            borderRadius: '6px',
            bgcolor: t.morph.stickers[color],
            border: `1.5px solid ${t.morph.sticker.peel}`,
            display: groupStart ? 'flex' : 'none',
            alignItems: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: 'text.primary',
          })}
        >
          File {groupLabel}
        </Box>
      </Box>
    </Paper>
  )
}

// A responsive divider between two pages. On mobile it's a FULL-WIDTH bar
// (forces a flex-line break) that reads as a horizontal split; on desktop it's
// a slim VERTICAL seam inline between two page cards. Inactive: a faint dashed
// seam with a scissor that brightens on hover. Active: a solid accent break
// where one output file ends and the next begins.
function CutDivider({ active, onClick, between }) {
  const [a, b] = between

  // A dashed (inactive) / solid accent (active) rule. `axis` is 'h' for the
  // horizontal mobile bar or 'v' for the vertical desktop seam.
  const rule = (axis) => (t) => {
    const line = active
      ? `3px solid ${t.palette.primary.main}`
      : `2px dashed ${t.palette.divider}`
    return {
      flex: 1,
      borderRadius: 3,
      transition: 'border-color 140ms ease',
      ...(axis === 'h' ? { height: 0, borderTop: line } : { width: 0, borderLeft: line }),
    }
  }

  const pill = (t) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1,
    py: 0.25,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    // Opaque in both states so the rule/stars behind never show through the
    // pill: sticker blue when selected, the surface colour when not.
    bgcolor: active ? t.morph.stickers.blue : 'background.paper',
    border: active ? `1.5px solid ${t.morph.sticker.peel}` : `1.5px solid ${t.palette.divider}`,
    color: 'text.primary',
    whiteSpace: 'nowrap',
  })

  return (
    <Box
      sx={{
        // Mobile: a full-width bar in normal flow below the card (each card is
        // its own row, so this becomes a clean horizontal split). Desktop: sit
        // in the gap to the RIGHT of the card, absolutely placed and vertically
        // centered, so the grid columns stay clean and nothing gets pushed to a
        // new row.
        mt: { xs: 0.5, sm: 0 },
        position: { sm: 'absolute' },
        top: { sm: 0 },
        right: { sm: 0 },
        bottom: { sm: 0 },
        // Nudge the ~34px-wide seam so its centre lands in the middle of the
        // 12px inter-card gap.
        transform: { sm: 'translateX(calc(50% + 6px))' },
        width: { sm: 34 },
        zIndex: 1,
      }}
    >
      <Tooltip title={active ? `Remove cut (pages ${a} | ${b})` : `Cut here (between pages ${a} and ${b})`}>
        <Box
          role="button"
          aria-label={active ? `Remove cut between pages ${a} and ${b}` : `Cut between pages ${a} and ${b}`}
          aria-pressed={active}
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick()
            }
          }}
          sx={(t) => ({
            height: '100%',
            display: 'flex',
            // Row of [rule · pill · rule] on mobile; a vertical stack on desktop.
            flexDirection: { xs: 'row', sm: 'column' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 1, sm: 0.75 },
            px: { xs: 1, sm: 0 },
            py: { xs: 0.75, sm: 0.5 },
            cursor: 'pointer',
            borderRadius: 2,
            color: active ? t.palette.primary.main : 'text.disabled',
            outline: 'none',
            transition: 'color 140ms ease, background-color 140ms ease',
            '@media (hover: hover)': {
              '&:hover': { color: t.palette.primary.main, bgcolor: 'action.hover' },
              '&:hover .cut-line': { borderColor: t.palette.primary.main },
            },
            '&:focus-visible': { outline: `3px solid ${t.palette.primary.main}`, outlineOffset: '2px' },
          })}
        >
          {/* Leading rule: horizontal on mobile, vertical on desktop. */}
          <Box className="cut-line" sx={[rule('h'), { display: { xs: 'block', sm: 'none' } }]} />
          <Box className="cut-line" sx={[rule('v'), { display: { xs: 'none', sm: 'block' } }]} />

          {/* The scissor pill. Full "Cut here" label on mobile; compact on desktop. */}
          <Box sx={pill}>
            <ContentCutRoundedIcon sx={{ fontSize: 15 }} />
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              {active ? 'Cut' : 'Cut here'}
            </Box>
          </Box>

          {/* Trailing rule. */}
          <Box className="cut-line" sx={[rule('h'), { display: { xs: 'block', sm: 'none' } }]} />
          <Box className="cut-line" sx={[rule('v'), { display: { xs: 'none', sm: 'block' } }]} />
        </Box>
      </Tooltip>
    </Box>
  )
}
