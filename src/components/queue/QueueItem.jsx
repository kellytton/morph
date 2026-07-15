import { useEffect, useState } from 'react'
import { Box, Paper, Typography, LinearProgress, IconButton, Tooltip } from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
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

function Thumb({ file }) {
  const url = useObjectUrl(file)
  return (
    <Box
      sx={(theme) => ({
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
      })}
    >
      {url ? (
        <Box
          component="img"
          src={url}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
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
export function QueueItem({ item, onDownload, onCancel, onRetry, onRemove }) {
  const isConverting = item.status === STATUS.CONVERTING || item.status === STATUS.PENDING
  const isDone = item.status === STATUS.DONE
  const isError = item.status === STATUS.ERROR

  // Ticket accent uses the target format's sticker color.
  const accent = getFormat(item.to).sticker

  return (
    <Paper
      sx={(theme) => ({
        p: 2,
        pl: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
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
      <Box sx={{ position: 'relative' }}>
        <Thumb file={item.file} />
        {/* Celebration burst anchored to the thumbnail on success. */}
        {isDone && <StarBurst />}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 700 }}>
          {item.file.name}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {item.mode === 'compress'
            ? `${item.from.toUpperCase()} · optimized`
            : `${item.from.toUpperCase()} → ${item.to.toUpperCase()}`}
          {' · '}
          {formatBytes(item.file.size)}
          {isDone && (
            <> {'→ '}<Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{formatBytes(item.result.size)}</Box></>
          )}
          {isDone && item.result.width > 0 && (
            <Box component="span" sx={{ opacity: 0.75 }}>
              {'  ·  '}
              {item.result.width}×{item.result.height}
            </Box>
          )}
        </Typography>

        {isConverting && (
          <LinearProgress
            variant="determinate"
            value={item.progress}
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 999,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { borderRadius: 999 },
            }}
          />
        )}
        {isError && (
          <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600, mt: 0.5 }}>
            {item.error}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <StatusPill item={item} />

        {isDone && (
          <Tooltip title="Download">
            <IconButton onClick={() => onDownload(item)} sx={{ color: 'primary.main' }}>
              <DownloadRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
        {isError && (
          <Tooltip title="Retry">
            <IconButton onClick={() => onRetry(item.id)}>
              <ReplayRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
        {isConverting ? (
          <Tooltip title="Cancel">
            <IconButton onClick={() => onCancel(item.id)}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Remove">
            <IconButton onClick={() => onRemove(item.id)}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  )
}
