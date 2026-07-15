import { useState } from 'react'
import { Box, Fade, Collapse, Alert } from '@mui/material'
import { UploadZone } from '../upload/UploadZone'
import { TargetSelector } from '../conversion/TargetSelector'
import { FormatCard } from '../conversion/FormatCard'
import { QualityControl } from '../conversion/QualityControl'
import { AdvancedOptions } from '../common/AdvancedOptions'
import { ConversionQueue } from '../queue/ConversionQueue'
import { ComingSoon } from '../common/ComingSoon'
import { useConversionQueue } from '../../hooks/useConversionQueue'
import { isEncodable, isLossy, isImageInput } from '../../converters/registry'
import { detectFormat } from '../../converters/detectFormat'

// Specific image accept hint for the file picker (better than a bare image/*):
// lists the exact formats we can decode, incl. extensions for types with weak
// MIME reporting (avif/heic/bmp). Drag-drop still bypasses this, so we also
// validate in handleFiles.
const IMAGE_ACCEPT = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'image/x-icon',
  '.png,.jpg,.jpeg,.webp,.avif,.gif,.bmp,.svg,.ico',
].join(',')

// Desktop column count for the explainer grid, chosen to keep rows balanced
// and avoid a lone orphan on the last row (e.g. 4 cards → 2×2, not 3+1).
function desktopColumns(count) {
  if (count <= 3) return count // 2 → 2-up, 3 → 3-up
  if (count === 4) return 2 // 2×2, avoids 3+1
  return 3 // 5 → 3+2, 6 → 3+3
}

/**
 * Convert mode. A single TargetSelector chooses the output format ("Convert
 * to → JPG"); each file's source is auto-detected on upload, so there's no
 * misleading fixed "source" chip. Files that already match the target are
 * auto-optimized. A quality slider appears (behind Advanced) only for lossy
 * targets.
 */
export function ConvertWorkspace({ conversion, onChangeTarget, onChangeConversion }) {
  const queue = useConversionQueue()
  const { to } = conversion
  // We can convert to any image format this browser can encode. Doc/media
  // targets aren't encodable → show the coming-soon panel.
  const supported = isEncodable(to)
  const lossy = isLossy(to)
  const [quality, setQuality] = useState(85)
  const [notice, setNotice] = useState(null)
  // Once a file is uploaded we know the real source, so we reveal its card.
  const hasUploaded = queue.items.length > 0
  // Formats to explain: just the target before upload; after upload, every
  // real source format present in the queue plus the target — deduped, so an
  // optimize (webp→webp) shows one card and a mixed batch shows each format
  // once. No cap: the grid below wraps, so all relevant formats are shown.
  const explainerFormats = hasUploaded
    ? [...new Set([...queue.items.map((it) => it.from), to])]
    : [to]

  const handleFiles = (files) => {
    // Validate: keep only files we can actually decode as an image source.
    // The accept="image/*" hint is bypassed by drag-drop and "All Files", so
    // this is the real guard. Rejected files get a gentle inline notice.
    const accepted = []
    const rejected = []
    for (const file of files) {
      const format = detectFormat(file)
      if (format && isImageInput(format)) accepted.push(file)
      else rejected.push(file)
    }

    if (rejected.length) {
      const names = rejected.slice(0, 2).map((f) => f.name).join(', ')
      const more = rejected.length > 2 ? ` +${rejected.length - 2} more` : ''
      setNotice(
        `${rejected.length} file${rejected.length > 1 ? 's' : ''} skipped — only images can be converted here (${names}${more}).`,
      )
    } else {
      setNotice(null)
    }
    if (!accepted.length) return

    // Reflect the first accepted file's format in the bar's source preview.
    const first = detectFormat(accepted[0])
    if (first && first !== conversion.from) {
      onChangeConversion?.({ from: first, to })
    }

    const params = lossy ? { quality: quality / 100 } : undefined

    // Split by intent: a file already in the target format is OPTIMIZED
    // (compress task), everything else is CONVERTED. Both share one queue.
    const toOptimize = []
    const toConvert = []
    for (const file of accepted) {
      const from = detectFormat(file) ?? conversion.from
      ;(from === to ? toOptimize : toConvert).push(file)
    }

    if (toConvert.length) {
      queue.addFiles(toConvert, {
        from: (file) => detectFormat(file) ?? conversion.from,
        to,
        params,
      })
    }
    if (toOptimize.length) {
      queue.addFiles(toOptimize, { mode: 'compress', from: to, params })
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { xs: 3, md: 6 } }}>
      <Fade in timeout={400}>
        <Box>
          {supported ? (
            // Unified card: the target selector is folded into the empty-state
            // message, so "convert to webp" reads as part of the drop prompt.
            <UploadZone
              onFiles={handleFiles}
              accept={IMAGE_ACCEPT}
              hint="Any image works — format auto-detected"
              footer={<TargetSelector to={to} onChangeTarget={onChangeTarget} />}
            />
          ) : (
            <ComingSoon
              title={`Converting to ${to.toUpperCase()} is coming soon`}
              message="We're busy teaching Morph this one. Image conversions are ready to go — pick an image target from the convert menu to try it now."
            />
          )}
        </Box>
      </Fade>

      {/* Gentle notice when unsupported files were skipped on upload. */}
      <Collapse in={Boolean(notice)} unmountOnExit>
        <Alert
          severity="warning"
          variant="outlined"
          onClose={() => setNotice(null)}
          sx={{ borderRadius: 3, fontWeight: 600, alignItems: 'center' }}
        >
          {notice}
        </Alert>
      </Collapse>

      {/* Convert stays clean by default; quality is tucked behind "Advanced"
          and only offered for lossy targets (a smart 85% default is used
          otherwise). Compress keeps its always-visible slider. */}
      <Collapse in={supported && lossy} unmountOnExit>
        <AdvancedOptions label="Advanced options">
          <QualityControl
            value={quality}
            onChange={setQuality}
            hint={`Applies when converting to ${to.toUpperCase()}. Lower quality means smaller files.`}
          />
        </AdvancedOptions>
      </Collapse>

      <ConversionQueue queue={queue} />

      {/* Explainer cards, laid out smartly by count so rows stay balanced and
          nothing sits alone: 1 → full-width horizontal card; otherwise a grid
          whose desktop column count avoids orphans (4 → 2×2, not 3+1). Always
          1-per-row on phones, 2-per-row on tablets. */}
      {explainerFormats.length === 1 ? (
        <FormatCard formatId={explainerFormats[0]} horizontal />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: `repeat(${desktopColumns(explainerFormats.length)}, 1fr)`,
            },
            gap: 3,
          }}
        >
          {explainerFormats.map((format) => (
            <FormatCard key={format} formatId={format} />
          ))}
        </Box>
      )}
    </Box>
  )
}
