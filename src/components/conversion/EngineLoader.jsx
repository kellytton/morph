import { useEffect, useState } from 'react'
import { Box, Paper, Typography, CircularProgress, Collapse } from '@mui/material'
import { onEngineLoadProgress, isEngineReady } from '../../converters/ffmpegEngine'

/**
 * A subtle banner shown while the ffmpeg core is downloading on first media
 * use. Hides once the engine is ready. Purely informational.
 */
export function EngineLoader() {
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(isEngineReady())

  useEffect(() => {
    return onEngineLoadProgress((p) => {
      if (p >= 1) {
        setReady(true)
        setLoading(false)
      } else {
        setLoading(true)
      }
    })
  }, [])

  return (
    <Collapse in={loading && !ready} unmountOnExit>
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <CircularProgress size={20} thickness={5} />
        <Box>
          <Typography sx={{ fontWeight: 700 }}>Warming up the converter…</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Downloading the media engine (~25&nbsp;MB, one time). It'll be cached after this.
          </Typography>
        </Box>
      </Paper>
    </Collapse>
  )
}
