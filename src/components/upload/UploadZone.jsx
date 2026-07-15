import { useRef, useState } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { keyframes } from '@mui/system'
import { alpha } from '@mui/material/styles'
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded'

// Gentle looping bob for the upload icon while hovering.
const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-7px); }
`

// A soft breathing glow around the zone on drag-over.
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 var(--glow); }
  50%      { box-shadow: 0 0 0 10px transparent; }
`

/**
 * Dashed drop area for selecting files. Handles click-to-browse, drag-over
 * highlighting, and drop, with playful hover/drag microinteractions. Emits
 * selected files via onFiles(File[]).
 */
export function UploadZone({ onFiles, accept = 'image/*', hint, footer }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const emit = (fileList) => {
    const files = Array.from(fileList ?? [])
    if (files.length) onFiles?.(files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    emit(e.dataTransfer.files)
  }

  return (
    <Paper sx={{ p: { xs: 1.5, md: 2 }, transition: 'background-color 240ms ease' }}>
      <Box
        role="button"
        tabIndex={0}
        aria-label="Select a file to convert, or drop a file here"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={dragOver ? 'is-dragover' : undefined}
        sx={(theme) => ({
          '--glow': alpha(theme.palette.primary.main, 0.35),
          cursor: 'pointer',
          borderRadius: `${theme.morph.radius - 6}px`,
          border: '3px dashed',
          borderColor: dragOver ? 'primary.main' : theme.morph.dropZoneBorder,
          bgcolor: dragOver ? 'action.hover' : 'transparent',
          px: 3,
          py: { xs: 4, md: 5 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.75,
          textAlign: 'center',
          outline: 'none',
          transition:
            'border-color 200ms ease, background-color 200ms ease, transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: dragOver ? 'scale(1.015)' : 'none',
          animation: dragOver ? `${pulse} 1.4s ease-in-out infinite` : 'none',

          // Hover state (pointer devices only): lift, warm the border, and
          // wake up the icon + copy.
          '@media (hover: hover)': {
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              transform: 'translateY(-3px) scale(1.008)',
            },
            '&:hover .upload-icon': {
              color: theme.palette.primary.main,
              animation: `${bob} 1.2s ease-in-out infinite`,
            },
            '&:hover .upload-title': { transform: 'translateY(-2px)' },
          },
          '&:focus-visible': {
            borderColor: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.06),
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            transform: 'none',
            '&:hover .upload-icon': { animation: 'none' },
          },
        })}
      >
        <IosShareRoundedIcon
          className="upload-icon"
          sx={{
            fontSize: 44,
            color: 'text.primary',
            mb: 0.5,
            transition: 'transform 200ms ease, color 200ms ease',
            transform: dragOver ? 'translateY(-6px) scale(1.08)' : 'none',
          }}
        />
        {/* One combined headline — 'drop' and 'browse' were two lines saying
            the same thing. */}
        <Typography
          className="upload-title"
          sx={{
            fontSize: { xs: 22, md: 28 },
            fontWeight: 700,
            transition: 'transform 220ms ease',
          }}
        >
          Drop your file or click to browse
        </Typography>

        {/* Optional contextual hint, rendered inside the card so decorative
            background stars sit behind the whole panel, not behind the text. */}
        {hint && (
          <Typography
            sx={{
              mt: 1,
              maxWidth: 420,
              color: 'text.secondary',
              fontWeight: 500,
              fontSize: 13.5,
              opacity: 0.85,
            }}
          >
            {hint}
          </Typography>
        )}

        {/* Optional footer content (e.g. the "convert to [webp]" selector),
            folded into the empty-state message. Interactive children stop
            propagation so clicking them doesn't also open the file dialog. */}
        {footer && (
          <Box
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
            sx={{ mt: 3, display: 'flex', justifyContent: 'center', cursor: 'default' }}
          >
            {footer}
          </Box>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => {
            emit(e.target.files)
            // Reset so selecting the SAME file(s) again still fires onChange.
            e.target.value = ''
          }}
        />
      </Box>
    </Paper>
  )
}
