import { Box, Button, Stack, Typography, Fade } from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded'
import { QueueItem } from './QueueItem'
import { ConversionStats } from './ConversionStats'
import { StickerButton } from '../common/StickerButton'
import { STATUS } from '../../hooks/useConversionQueue'

/**
 * The conversion queue section: header with batch actions, the list of items,
 * and the analytics summary. Driven entirely by the queue hook's state.
 */
export function ConversionQueue({ queue }) {
  const { items, downloadOne, downloadAll, cancelItem, retryItem, removeItem, clear } = queue
  if (items.length === 0) return null

  const doneCount = items.filter((it) => it.status === STATUS.DONE).length

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
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
          startIcon={<DownloadRoundedIcon sx={{ fontSize: 20 }} />}
          disabled={doneCount === 0}
          onClick={downloadAll}
        >
          {doneCount > 1 ? 'Download all (ZIP)' : 'Download'}
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
              />
            </Box>
          </Fade>
        ))}
      </Stack>

      <ConversionStats items={items} />
    </Stack>
  )
}
