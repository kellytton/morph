import { useState } from 'react'
import { Box, Fade, Paper, Typography } from '@mui/material'
import CompressRoundedIcon from '@mui/icons-material/CompressRounded'
import { UploadZone } from '../upload/UploadZone'
import { FormatChip } from '../conversion/FormatChip'
import { QualityControl } from '../conversion/QualityControl'
import { ConversionQueue } from '../queue/ConversionQueue'
import { ComingSoon } from '../common/ComingSoon'
import { useConversionQueue } from '../../hooks/useConversionQueue'
import { canCompress } from '../../converters/registry'
import { getFormat } from '../../config/conversions'

/**
 * Compress mode: shrink files while keeping their format. Works for images
 * (lossy re-encode at a chosen quality). A quality slider tunes the trade-off;
 * lower = smaller files. Non-image formats show a coming-soon panel.
 */
export function CompressWorkspace({ selection }) {
  const queue = useConversionQueue()
  const format = selection.format
  const supported = canCompress(format)
  const [quality, setQuality] = useState(70)

  const handleFiles = (files) => {
    queue.addFiles(files, {
      mode: 'compress',
      from: format,
      params: { quality: quality / 100 },
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { xs: 3, md: 6 } }}>
      {/* Header row: what we're compressing + the format sticker. */}
      <Paper sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <FormatChip formatId={format} size="icon" icon={<CompressRoundedIcon sx={{ color: 'text.primary' }} />} />
        <Box>
          <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 700 }}>
            Compress {getFormat(format).label.toUpperCase()}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Shrink file size while keeping the {getFormat(format).label.toUpperCase()} format.
          </Typography>
        </Box>
      </Paper>

      {supported ? (
        <>
          <QualityControl value={quality} onChange={setQuality} />

          <Fade in timeout={400}>
            <Box>
              <UploadZone onFiles={handleFiles} accept="image/*" />
            </Box>
          </Fade>

          <ConversionQueue queue={queue} />
        </>
      ) : (
        <ComingSoon
          title={`Compressing ${getFormat(format).label.toUpperCase()} is coming soon`}
          message="Image compression is ready to go — pick PNG, JPG, WebP, or AVIF from the compress menu to try it now."
        />
      )}
    </Box>
  )
}
