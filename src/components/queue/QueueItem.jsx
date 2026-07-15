import { useEffect, useState } from 'react'
import { Box, Paper, Typography, LinearProgress, IconButton, Tooltip } from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import { STATUS } from '../../hooks/useConversionQueue'
import { formatBytes, percentChange } from '../../utils/format'
import { StarBurst } from '../decor/StarBurst'
import { getFormat } from '../../config/conversions'

// Object-URL thumbnail for the source image. The URL is CREATED inside the
// effect (not memoized during render): under React 19 StrictMode the effect
// runs mount→cleanup→mount, so a render-time URL would get revoked and never
// recreated (naturalWidth 0 = broken thumbnail). Creating fresh per effect run
// guarantees the committed render always has a live, un-revoked blob URL.
function useObjectUrl(file) {
  const isImage = Boolean(file?.type?.startsWith('image/'))
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!isImage) return undefined
    const objectUrl = URL.createObjectURL(file)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URLs must be created in an effect for correct revoke pairing
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file, isImage])

  return isImage ? url : null
}

function Thumb({ file, onExpand }) {
  const url = useObjectUrl(file)
  // Only clickable when there's an image to enlarge.
  const clickable = Boolean(url && onExpand)
  return (
    <Box
      {...(clickable
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-label': 'Expand preview',
            onClick: onExpand,
            onKeyDown: (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onExpand()
              }
            },
          }
        : {})}
      sx={(theme) => ({
        position: 'relative',
        width: 60,
        height: 60,
        borderRadius: '16px',
        flexShrink: 0,
        overflow: 'hidden',
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Sticker-style peel edge on the thumbnail.
        border: `2px solid ${theme.morph.sticker.peel}`,
        boxShadow: theme.morph.sticker.shadow,
        cursor: clickable ? 'zoom-in' : 'default',
        outline: 'none',
        transition: 'transform 160ms ease',
        '& .thumb-zoom': { opacity: 0 },
        ...(clickable && {
          '@media (hover: hover)': {
            '&:hover': { transform: 'scale(1.04)' },
            '&:hover .thumb-zoom': { opacity: 1 },
          },
          '&:focus-visible': { outline: `3px solid ${theme.palette.primary.main}`, outlineOffset: '2px' },
        }),
      })}
    >
      {url ? (
        <>
          <Box
            component="img"
            src={url}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {clickable && (
            <Box
              className="thumb-zoom"
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.35)',
                transition: 'opacity 160ms ease',
              }}
            >
              <ZoomInRoundedIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
          )}
        </>
      ) : (
        <ImageRoundedIcon sx={{ color: 'text.secondary' }} />
      )}
    </Box>
  )
}

// Maps a status tone to a sticker-palette color, matching the format chips.
const TONE_STICKER = { good: 'mint', neutral: 'lemon', bad: 'peach' }

// A stickery status pill: rounded, peel border, soft shadow, sticker-palette
// fill. Text uses text.primary so it's dark on the light-mode pastels and
// light on the dark-mode swatches — exactly like the png/jpg format chips.
function StickerPill({ icon, label, tone }) {
  const sticker = TONE_STICKER[tone] ?? TONE_STICKER.neutral
  return (
    <Box
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        pl: 0.75,
        pr: 1.25,
        py: 0.4,
        borderRadius: 999,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        fontWeight: 700,
        fontSize: 13,
        color: 'text.primary',
        bgcolor: theme.morph.stickers[sticker],
        border: `2px solid ${theme.morph.sticker.peel}`,
        boxShadow: theme.morph.sticker.shadow,
      })}
    >
      {icon}
      {label}
    </Box>
  )
}

function StatusPill({ item }) {
  if (item.status === STATUS.DONE) {
    // We kept the original because re-encoding couldn't beat it.
    if (item.result.optimal) {
      return (
        <StickerPill
          tone="good"
          icon={<CheckRoundedIcon sx={{ fontSize: 16 }} />}
          label="already optimal"
        />
      )
    }
    const delta = percentChange(item.file.size, item.result.size)
    const saved = delta < 0
    const label = saved
      ? `${Math.abs(delta)}% smaller`
      : delta > 0
        ? `${delta}% larger`
        : 'done'
    return (
      <StickerPill
        tone={saved ? 'good' : 'neutral'}
        icon={<CheckRoundedIcon sx={{ fontSize: 16 }} />}
        label={label}
      />
    )
  }
  if (item.status === STATUS.ERROR) {
    return (
      <StickerPill
        tone="bad"
        icon={<ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />}
        label="failed"
      />
    )
  }
  if (item.status === STATUS.CANCELED) {
    return <StickerPill tone="neutral" label="canceled" />
  }
  return null
}

/**
 * One row in the conversion queue: thumbnail, filename + from→to, a live
 * progress bar while converting, size delta on completion, and per-item
 * actions (download / retry / remove). Pops a star-burst on success.
 */
export function QueueItem({ item, onDownload, onCancel, onRetry, onRemove, onExpand }) {
  const isConverting = item.status === STATUS.CONVERTING || item.status === STATUS.PENDING
  const isDone = item.status === STATUS.DONE
  const isError = item.status === STATUS.ERROR

  // After a few seconds of processing, reassure the user it's still working —
  // this naturally only appears for slow (media) items; fast image ops finish
  // first. We don't show a time *estimate* (browser rates are erratic and a
  // wrong countdown erodes trust) — just honest reassurance. Gated on
  // isConverting so a stale flag never shows after the item finishes.
  const [slowElapsed, setSlowElapsed] = useState(false)
  useEffect(() => {
    if (!isConverting) return undefined
    const t = setTimeout(() => setSlowElapsed(true), 5000)
    return () => {
      clearTimeout(t)
      setSlowElapsed(false)
    }
  }, [isConverting])
  const slow = isConverting && slowElapsed

  // Ticket accent uses the target format's sticker color.
  const accent = getFormat(item.to).sticker

  return (
    <Paper
      sx={(theme) => ({
        p: { xs: 1.5, sm: 2 },
        pl: { xs: 2, sm: 2.5 },
        // Mobile: stack the info row over an actions row so nothing competes
        // for horizontal space. Desktop: everything on one row.
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        // Tighter vertical gap on mobile so the chip row sits close to the meta,
        // reading as one cohesive card rather than two detached blocks.
        gap: { xs: 0.75, sm: 2 },
        position: 'relative',
        overflow: 'visible',
        // Colored left-edge "ticket" accent in the target sticker color.
        borderLeft: `6px solid ${theme.morph.stickers[accent]}`,
        transition:
          'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease',
        '@media (hover: hover)': {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.morph.sticker.shadowHover,
          },
        },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      })}
    >
      {/* Info row: thumbnail + name/meta. On mobile this is the top row. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 }, minWidth: 0, flex: 1 }}>
        <Box sx={{ position: 'relative' }}>
          <Thumb file={item.file} onExpand={onExpand ? () => onExpand(item) : undefined} />
          {/* Celebration burst anchored to the thumbnail on success. */}
          {isDone && <StarBurst />}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 700 }}>
            {item.file.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              lineHeight: 1.4,
              // Wrap between the conversion facts (never mid-token, so units like
              // "51.7 KB" stay whole) — all info stays visible over 1–2 lines.
              wordBreak: 'normal',
              overflowWrap: 'normal',
            }}
          >
            {/* Format pair (e.g. PNG → WEBP, or "PNG · optimized"). */}
            <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
              {item.mode === 'compress'
                ? `${item.from.toUpperCase()} · optimized`
                : `${item.from.toUpperCase()} → ${item.to.toUpperCase()}`}
            </Box>{' · '}
            {/* Original size (kept whole). */}
            <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{formatBytes(item.file.size)}</Box>
            {isDone && (
              <>
                {' → '}
                <Box component="span" sx={{ whiteSpace: 'nowrap', color: 'text.primary', fontWeight: 700 }}>
                  {formatBytes(item.result.size)}
                </Box>
              </>
            )}
            {/* Output dimensions — tertiary info, dimmed so a wrap here reads as
                deliberate supplementary detail rather than an accidental break. */}
            {isDone && item.result.width > 0 && (
              <Box component="span" sx={{ whiteSpace: 'nowrap', opacity: 0.6 }}>
                {' · '}
                {item.result.width}×{item.result.height}
              </Box>
            )}
          </Typography>

          {isConverting && (
            <LinearProgress
              // GIF (two-pass) can't report linear progress, so animate an
              // indeterminate bar rather than show a false 100%-then-restart.
              variant={item.params?.indeterminate ? 'indeterminate' : 'determinate'}
              value={item.params?.indeterminate ? undefined : item.progress}
              sx={{
                mt: 1,
                height: 8,
                borderRadius: 999,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { borderRadius: 999 },
              }}
            />
          )}
          {slow && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5, fontStyle: 'italic' }}
            >
              Still working — larger files can take a moment.
            </Typography>
          )}
          {isError && (
            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600, mt: 0.5 }}>
              {item.error}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Actions row: status pill + buttons. On mobile it's its own full-width
          row (pill left-aligned, buttons pushed right); on desktop it sits
          inline at the end. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          flexShrink: 0,
          // Full-width on mobile so the pill sits at the left and buttons right.
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        {!isConverting && (
          <Box sx={{ mr: { sm: 0.5 } }}>
            <StatusPill item={item} />
          </Box>
        )}
        {/* Push the action buttons to the right edge on mobile. */}
        <Box sx={{ flex: 1, display: { xs: 'block', sm: 'none' } }} />

        {isDone && (
          <Tooltip title="Download">
            <IconButton
              aria-label={`Download ${item.file.name}`}
              onClick={() => onDownload(item)}
              sx={{ color: 'primary.main' }}
            >
              <DownloadRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
        {isError && (
          <Tooltip title="Retry">
            <IconButton aria-label={`Retry ${item.file.name}`} onClick={() => onRetry(item.id)}>
              <ReplayRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
        {isConverting ? (
          <Tooltip title="Cancel">
            <IconButton aria-label={`Cancel ${item.file.name}`} onClick={() => onCancel(item.id)}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Remove">
            <IconButton aria-label={`Remove ${item.file.name}`} onClick={() => onRemove(item.id)}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  )
}
