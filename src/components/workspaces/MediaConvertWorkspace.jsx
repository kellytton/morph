import { useState } from 'react'
import { Box, Fade, Collapse, Alert, Typography } from '@mui/material'
import { UploadZone } from '../upload/UploadZone'
import { MediaTargetSelector } from '../conversion/MediaTargetSelector'
import { FormatCard } from '../conversion/FormatCard'
import { ConversionQueue } from '../queue/ConversionQueue'
import { EngineLoader } from '../conversion/EngineLoader'
import { useConversionQueue } from '../../hooks/useConversionQueue'
import { canConvert, isMediaFormat, isVideo, isAudio } from '../../converters/registry'
import { detectFormat } from '../../converters/detectFormat'

// Accept hint per target family: video targets accept video files, audio
// targets accept audio files.
const VIDEO_ACCEPT = 'video/*,.mkv'
const AUDIO_ACCEPT = 'audio/*,.m4a'

function desktopColumns(count) {
  if (count <= 3) return count
  if (count === 4) return 2
  return 3
}

/**
 * Media convert mode (video + audio, powered by ffmpeg.wasm). Mirrors the
 * image ConvertWorkspace but is family-aware: a video source can only target
 * video/gif, an audio source only audio. The ffmpeg core lazy-loads on first
 * use, with a loading indicator. Progress is real (driven by the engine).
 */
export function MediaConvertWorkspace({ conversion, onChangeTarget }) {
  const queue = useConversionQueue()
  const { to } = conversion
  const targetIsVideo = isVideo(to)
  const accept = targetIsVideo ? VIDEO_ACCEPT : AUDIO_ACCEPT
  const [notice, setNotice] = useState(null)

  const hasUploaded = queue.items.length > 0
  const explainerFormats = hasUploaded
    ? [...new Set([...queue.items.map((it) => it.from), to])]
    : [to]

  const handleFiles = (files) => {
    const accepted = []
    const rejected = []
    for (const file of files) {
      const from = detectFormat(file)
      // Accept only media of the SAME family as the target and that we can
      // actually convert (e.g. audio file when targeting mp3).
      const familyOk = from && isMediaFormat(from) && canConvert(from, to)
      if (familyOk) accepted.push({ file, from })
      else rejected.push(file)
    }

    if (rejected.length) {
      const kind = targetIsVideo ? 'video' : 'audio'
      const names = rejected.slice(0, 2).map((f) => f.name).join(', ')
      const more = rejected.length > 2 ? ` +${rejected.length - 2} more` : ''
      setNotice(
        `${rejected.length} file${rejected.length > 1 ? 's' : ''} skipped — pick ${kind} files to convert to ${to.toUpperCase()} (${names}${more}).`,
      )
    } else {
      setNotice(null)
    }
    if (!accepted.length) return

    // Reflect the first file's format in the preview source.
    const first = accepted[0].from
    if (first && first !== conversion.from) onChangeTarget?.(to, first)

    // Queue each file with its detected source; mark as media so the queue
    // drives real ffmpeg progress. GIF is a two-pass (palettegen + paletteuse)
    // encode whose progress resets mid-run, so we mark it indeterminate — the
    // bar animates instead of lying (fill to 100%, then restart).
    queue.addFiles(
      accepted.map((a) => a.file),
      {
        from: (file) => detectFormat(file) ?? conversion.from,
        to,
        params: { isMedia: true, indeterminate: to === 'gif' },
      },
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { xs: 3, md: 6 } }}>
      <EngineLoader />

      <Fade in timeout={400}>
        <Box>
          <UploadZone
            onFiles={handleFiles}
            accept={accept}
            hint={`Drop a ${targetIsVideo ? 'video' : 'audio'} file — we convert it to ${to.toUpperCase()} right in your browser.`}
            headingLevel="h1"
            footer={<MediaTargetSelector to={to} onChangeTarget={(next) => onChangeTarget?.(next)} />}
          />
        </Box>
      </Fade>

      <Collapse in={Boolean(notice)} unmountOnExit>
        <Alert
          role="alert"
          severity="warning"
          variant="outlined"
          onClose={() => setNotice(null)}
          sx={{ borderRadius: 3, fontWeight: 600, alignItems: 'center' }}
        >
          {notice}
        </Alert>
      </Collapse>

      <ConversionQueue queue={queue} />

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

      {/* First-run note: the engine downloads once, then is cached. */}
      {!hasUploaded && (
        <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 500, fontSize: 13 }}>
          {isAudio(to) ? 'Audio' : 'Video'} conversion runs 100% in your browser. The
          converter (~31&nbsp;MB) loads once on your first conversion.
        </Typography>
      )}
    </Box>
  )
}
