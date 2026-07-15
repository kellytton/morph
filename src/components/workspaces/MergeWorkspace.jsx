import { useState } from 'react'
import { Box, Fade, Paper, Typography, IconButton, Tooltip, Button, Stack, Chip } from '@mui/material'
import CallMergeRoundedIcon from '@mui/icons-material/CallMergeRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { UploadZone } from '../upload/UploadZone'
import { formatBytes } from '../../utils/format'

// Describes each merge operation's copy + which files it accepts.
const OP_META = {
  'merge-pdf': { title: 'Merge PDFs', accept: 'application/pdf', unit: 'PDF', verb: 'Merge' },
  'reorder-pdf': { title: 'Rearrange pages', accept: 'application/pdf', unit: 'PDF', verb: 'Save order' },
  'split-pdf': { title: 'Split PDF', accept: 'application/pdf', unit: 'PDF', verb: 'Split' },
  'images-to-pdf': { title: 'Images → PDF', accept: 'image/*', unit: 'image', verb: 'Build PDF' },
  'combine-images': { title: 'Combine into one image', accept: 'image/*', unit: 'image', verb: 'Combine' },
}

let uid = 0

/**
 * Merge mode: gather files, arrange their order, then run the operation.
 * The reorder UI is fully interactive; the actual merge/split engine is
 * scaffolded (needs a PDF library) and reports a coming-soon action for now.
 */
export function MergeWorkspace({ selection }) {
  const meta = OP_META[selection.op] ?? OP_META['merge-pdf']
  const [files, setFiles] = useState([])
  const [notice, setNotice] = useState(null)

  const addFiles = (incoming) => {
    setFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({ id: `m${++uid}`, file })),
    ])
    setNotice(null)
  }

  const move = (index, dir) => {
    setFiles((prev) => {
      const next = [...prev]
      const j = index + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }
  const remove = (id) => setFiles((prev) => prev.filter((f) => f.id !== id))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { xs: 3, md: 6 } }}>
      <Paper sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box
          sx={(t) => ({
            width: 44,
            height: 44,
            borderRadius: '12px',
            bgcolor: t.morph.stickers.lilac,
            border: `2px solid ${t.morph.sticker.peel}`,
            boxShadow: t.morph.sticker.shadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          })}
        >
          <CallMergeRoundedIcon sx={{ color: 'text.primary' }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 700 }}>{meta.title}</Typography>
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Add your {meta.unit}s, arrange the order, then {meta.verb.toLowerCase()}.
          </Typography>
        </Box>
      </Paper>

      <Fade in timeout={400}>
        <Box>
          <UploadZone onFiles={addFiles} accept={meta.accept} />
        </Box>
      </Fade>

      {files.length > 0 && (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>Order</Typography>
            <Chip size="small" label={`${files.length} ${meta.unit}${files.length > 1 ? 's' : ''}`} sx={{ fontWeight: 600 }} />
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              onClick={() => setNotice('coming-soon')}
              sx={{ color: 'background.default' }}
            >
              {meta.verb}
            </Button>
          </Stack>

          {notice === 'coming-soon' && (
            <Paper sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>
                ✨ The merge engine is coming soon — but your order is all set! We're
                wiring up the PDF toolkit next.
              </Typography>
            </Paper>
          )}

          {files.map((f, i) => (
            <Paper
              key={f.id}
              sx={(t) => ({
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderLeft: `6px solid ${t.morph.stickers.lilac}`,
              })}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </Box>
              <DescriptionRoundedIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 700 }}>
                  {f.file.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {formatBytes(f.file.size)}
                </Typography>
              </Box>
              <Tooltip title="Move up">
                <span>
                  <IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUpwardRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down">
                <span>
                  <IconButton size="small" disabled={i === files.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDownwardRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton size="small" onClick={() => remove(f.id)}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  )
}
