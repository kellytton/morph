import { useState } from 'react'
import { Box, Button, Stack, Typography, Fade } from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded'
import { QueueItem } from './QueueItem'
import { ConversionStats } from './ConversionStats'
import { ImageCompareLightbox } from './ImageCompareLightbox'
import { StickerButton } from '../common/StickerButton'
import { STATUS } from '../../hooks/useConversionQueue'

/**
 * The conversion queue section: header with batch actions, the list of items,
 * and the analytics summary. Driven entirely by the queue hook's state.
 */
export function ConversionQueue({ queue }) {
  const { items, downloadOne, downloadAll, cancelItem, retryItem, removeItem, clear } = queue
  // Which item is shown enlarged in the compare lightbox (by id), or null.
  const [expandedId, setExpandedId] = useState(null)
  if (items.length === 0) return null

  const doneCount = items.filter((it) => it.status === STATUS.DONE).length
  const expanded = items.find((it) => it.id === expandedId) ?? null

  // A concise, politely-announced summary of queue progress for screen readers,
  // so completions/failures are conveyed without spamming per-progress-tick.
  const errorCount = items.filter((it) => it.status === STATUS.ERROR).length
  const busyCount = items.filter(
    (it) => it.status === STATUS.PENDING || it.status === STATUS.CONVERTING,
  ).length
  const liveParts = []
  if (busyCount) liveParts.push(`${busyCount} processing`)
  if (doneCount) liveParts.push(`${doneCount} done`)
  if (errorCount) liveParts.push(`${errorCount} failed`)
  const liveMessage = liveParts.length ? `Queue: ${liveParts.join(', ')}.` : ''

  return (
    <Stack spacing={2.5}>
      {/* Visually-hidden polite live region: announces queue progress to screen
          readers as items finish or fail, without cluttering the visual UI. */}
      <Box
        role="status"
        aria-live="polite"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {liveMessage}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
        <Typography component="h2" sx={{ fontSize: 22, fontWeight: 700, m: 0 }}>
          Queue
          <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
            {items.length}
          </Box>
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          startIcon={<DeleteSweepRoundedIcon />}
          onClick={clear}
          sx={{ color: 'text.secondary' }}
        >
          Clear
        </Button>
        <StickerButton
          sticker="blue"
          aria-label={doneCount > 1 ? 'Download all as ZIP' : 'Download'}
          startIcon={<DownloadRoundedIcon sx={{ fontSize: 20 }} />}
          disabled={doneCount === 0}
          onClick={downloadAll}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {doneCount > 1 ? 'Download all (ZIP)' : 'Download'}
          </Box>
        </StickerButton>
      </Box>

      <Stack spacing={1.5}>
        {items.map((item) => (
          <Fade in key={item.id} timeout={300}>
            <Box>
              <QueueItem
                item={item}
                onDownload={downloadOne}
                onCancel={cancelItem}
                onRetry={retryItem}
                onRemove={removeItem}
                onExpand={(it) => setExpandedId(it.id)}
              />
            </Box>
          </Fade>
        ))}
      </Stack>

      <ConversionStats items={items} />

      <ImageCompareLightbox item={expanded} onClose={() => setExpandedId(null)} />
    </Stack>
  )
}
