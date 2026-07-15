import { useState } from 'react'
import { Box, Fade, Paper, Typography } from '@mui/material'
import CompressRoundedIcon from '@mui/icons-material/CompressRounded'
import { UploadZone } from '../upload/UploadZone'
import { FormatChip } from '../conversion/FormatChip'
import { CompressTargetSelector } from '../conversion/CompressTargetSelector'
import { QualityControl } from '../conversion/QualityControl'
import { ResizeControl, RESIZE_OFF } from '../conversion/ResizeControl'
import { ConversionQueue } from '../queue/ConversionQueue'
import { ComingSoon } from '../common/ComingSoon'
import { useConversionQueue } from '../../hooks/useConversionQueue'
import { canCompress, isMediaFormat, isLossy } from '../../converters/registry'
import { getFormat } from '../../config/conversions'

/**
 * Compress mode: shrink files while keeping their format. Works for images
 * (lossy re-encode at a chosen quality). A quality slider tunes the trade-off;
 * lower = smaller files. Non-image formats show a coming-soon panel.
 */
export function CompressWorkspace({ selection, onChangeFormat }) {
  const queue = useConversionQueue()
  const format = selection.format
  const supported = canCompress(format)
  const [quality, setQuality] = useState(70)
  const [maxDimension, setMaxDimension] = useState(RESIZE_OFF)

  // A quality slider only shrinks LOSSY encoders (jpg/webp/avif) and media
  // (ffmpeg). Lossless images (png/bmp/ico) ignore it, so they get a
  // max-dimension resize control — the real size lever for lossless.
  const usesQuality = isLossy(format) || isMediaFormat(format)

  // Accept the file type that matches what we're compressing, so media/PDF
  // selections don't silently reject their own files behind an image-only
  // picker. Drag-drop bypasses this hint anyway; the queue re-encodes by format.
  const accept = isMediaFormat(format) ? `${format === 'mp3' ? 'audio' : 'video'}/*` : `.${format}`

  const handleFiles = (files) => {
    // Lossy → quality; lossless → optional downscale (omit the cap when "Full
    // size", so the compressor just re-encodes/strips metadata).
    const params = usesQuality
      ? { quality: quality / 100 }
      : maxDimension < RESIZE_OFF
        ? { maxDimension }
        : {}
    // Media compression runs through ffmpeg, which reports real progress — flag
    // it so the queue drives the bar from the engine instead of a fake ramp.
    if (isMediaFormat(format)) params.isMedia = true
    queue.addFiles(files, { mode: 'compress', from: format, params })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { xs: 3, md: 6 } }}>
      {/* Header row: the compress icon, an interactive "Compress → [format]"
          switcher (change what you're compressing without the nav menu), and a
          short description. */}
      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          flexWrap: 'wrap',
          rowGap: 1.5,
        }}
      >
        <FormatChip
          formatId={format}
          size="icon"
          icon={<CompressRoundedIcon sx={{ color: 'text.primary' }} />}
        />
        <CompressTargetSelector format={format} onChangeFormat={onChangeFormat} />
        <Typography
          sx={{ color: 'text.secondary', fontWeight: 500, flexBasis: { xs: '100%', md: 'auto' }, ml: { md: 1 } }}
        >
          {usesQuality
            ? `Shrink file size while keeping the ${getFormat(format).label.toUpperCase()} format.`
            : `${getFormat(format).label.toUpperCase()} is lossless — resize the largest edge to save space, no pixels lost.`}
        </Typography>
      </Paper>

      {supported ? (
        <>
          {usesQuality ? (
            <QualityControl value={quality} onChange={setQuality} />
          ) : (
            <ResizeControl value={maxDimension} onChange={setMaxDimension} />
          )}

          <Fade in timeout={400}>
            <Box>
              <UploadZone
                onFiles={handleFiles}
                accept={accept}
                hint={`Drop a ${getFormat(format).label.toUpperCase()} to shrink it — format stays the same`}
              />
            </Box>
          </Fade>

          <ConversionQueue queue={queue} />
        </>
      ) : (
        <ComingSoon
          title={`Compressing ${getFormat(format).label.toUpperCase()} is coming soon`}
          message="Image (PNG, JPG, WebP, AVIF) and media (MP4, MP3) compression are ready to go — pick one from the compress menu to try it now."
        />
      )}
    </Box>
  )
}
