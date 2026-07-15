import { useState, useRef, useMemo } from 'react'
import {
  Box,
  Fade,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Alert,
} from '@mui/material'
import CallMergeRoundedIcon from '@mui/icons-material/CallMergeRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { UploadZone } from '../upload/UploadZone'
import { MergeWorkspaceHeader } from './MergeWorkspaceHeader'
import { SplitPdfWorkspace } from './SplitPdfWorkspace'
import { EditPdfPagesWorkspace } from './EditPdfPagesWorkspace'
import { PdfPageEditor } from './PdfPageEditor'
import { StickerToggle } from '../common/StickerToggle'
import { StickerButton } from '../common/StickerButton'
import { useFlipReorder } from '../../hooks/useFlipReorder'
import { mergePdfs, editPdfPages } from '../../converters/pdfConverters'
import { downloadBlob } from '../../utils/download'
import { formatBytes } from '../../utils/format'

let uid = 0

/**
 * Merge mode: gather PDFs, arrange their order, then combine them into one.
 * Two arrangement modes:
 *   • "files" — concatenate whole PDFs in the chosen order (fast path).
 *   • "pages" — load every page as a thumbnail so pages can be interleaved,
 *     reordered, rotated, or dropped across all the added PDFs.
 * Split and page-editing operations are delegated to their own workspaces.
 */
function MergePdfWorkspace({ op, onChangeOp }) {
  const [files, setFiles] = useState([])
  const [arrange, setArrange] = useState('files') // 'files' | 'pages'
  const [pageCount, setPageCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const editorRef = useRef(null)
  const listRef = useRef(null)
  // Cancellation: browser PDF work can't be aborted mid-run, so cancel just
  // flags the in-flight run to discard its result (skip the download) and
  // returns to the ready state.
  const canceledRef = useRef(false)

  // The raw File[] in current order, for the page editor. Recomputed only when
  // the file list changes so the editor doesn't needlessly reload thumbnails.
  const orderedFiles = useMemo(() => files.map((f) => f.file), [files])

  // Smoothly slide rows to their new spots when reordered (no snap/flicker).
  // Only a true reorder animates; adding/removing files just settles in place.
  useFlipReorder(listRef, files.map((f) => f.id))

  const addFiles = (incoming) => {
    const pdfs = incoming.filter((f) => f.type === 'application/pdf')
    setFiles((prev) => [...prev, ...pdfs.map((file) => ({ id: `m${++uid}`, file }))])
    setError(null)
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

  const run = async () => {
    setError(null)
    canceledRef.current = false
    setBusy(true)
    try {
      let blob
      if (arrange === 'pages') {
        const pages = editorRef.current?.getPages() ?? []
        if (!pages.length) {
          setError('Keep at least one page to merge.')
          return
        }
        ;({ blob } = await editPdfPages(pages))
      } else {
        if (files.length < 2) {
          setError('Add at least two PDFs to merge.')
          return
        }
        ;({ blob } = await mergePdfs(orderedFiles))
      }
      if (canceledRef.current) return // canceled mid-run — discard the result
      downloadBlob(blob, 'merged.pdf')
    } catch (e) {
      if (!canceledRef.current) setError(e?.message ?? 'Something went wrong while merging.')
    } finally {
      setBusy(false)
    }
  }

  const cancel = () => {
    canceledRef.current = true
    setBusy(false)
  }

  // Disable Merge until it can actually produce something: 2+ files in "whole
  // files" mode, or at least one page in "rearrange pages" mode.
  const mergeDisabled =
    busy ||
    (arrange === 'pages' ? pageCount === 0 : files.length < 2)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { xs: 3, md: 6 } }}>
      <MergeWorkspaceHeader
        icon={<CallMergeRoundedIcon sx={{ color: 'text.primary' }} />}
        title="Merge PDFs"
        subtitle="Add your PDFs, arrange them by file or by page, then merge into one."
        op={op}
        onChangeOp={onChangeOp}
      />

      <Fade in timeout={400}>
        <Box>
          <UploadZone
            onFiles={addFiles}
            accept="application/pdf"
            hint={
              files.length
                ? 'Add another PDF to include it in the merge'
                : 'Drop two or more PDFs to combine them into one'
            }
          />
        </Box>
      </Fade>

      {files.length > 0 && (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>Arrange</Typography>
            <StickerToggle
              ariaLabel="Arrange by"
              value={arrange}
              onChange={setArrange}
              size="small"
              options={[
                { value: 'files', label: 'Whole files', sticker: 'lilac' },
                { value: 'pages', label: 'Rearrange pages', sticker: 'mint' },
              ]}
            />
            <Chip
              size="small"
              label={
                arrange === 'pages'
                  ? `${pageCount} page${pageCount === 1 ? '' : 's'}`
                  : `${files.length} PDF${files.length > 1 ? 's' : ''}`
              }
              sx={{ fontWeight: 600 }}
            />
            <Box sx={{ flex: 1 }} />
            {busy ? (
              <StickerButton
                sticker="peach"
                aria-label="Cancel"
                startIcon={<CloseRoundedIcon sx={{ fontSize: 20 }} />}
                onClick={cancel}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Cancel</Box>
              </StickerButton>
            ) : (
              <StickerButton
                sticker="blue"
                aria-label="Merge"
                startIcon={<CallMergeRoundedIcon sx={{ fontSize: 20 }} />}
                disabled={mergeDisabled}
                onClick={run}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Merge</Box>
              </StickerButton>
            )}
          </Stack>

          {error && <Alert role="alert" severity="error">{error}</Alert>}

          {arrange === 'pages' && (
            <PdfPageEditor
              ref={editorRef}
              files={orderedFiles}
              onError={setError}
              onCountChange={setPageCount}
            />
          )}

          {arrange === 'files' && (
          <Box ref={listRef} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {files.map((f, i) => (
            <Paper
              key={f.id}
              data-flip-id={f.id}
              sx={(t) => ({
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderLeft: `6px solid ${t.morph.stickers.lilac}`,
                // FLIP drives `transform`; keep the browser from fighting it.
                willChange: 'transform',
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
                  <IconButton aria-label={`Move ${f.file.name} up`} size="small" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUpwardRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down">
                <span>
                  <IconButton aria-label={`Move ${f.file.name} down`} size="small" disabled={i === files.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDownwardRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton aria-label={`Remove ${f.file.name}`} size="small" onClick={() => remove(f.id)}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>
            ))}
          </Box>
          )}
        </Stack>
      )}
    </Box>
  )
}

/**
 * Routes to the right merge-family workspace based on the selected operation.
 */
export function MergeWorkspace({ selection, onChangeMerge }) {
  // Pass the current op + change handler so each sub-workspace's header can show
  // the in-place operation switcher. Default to merge-pdf so the toggle
  // highlights the right segment on the default (no-op) merge landing.
  const op = selection.op ?? 'merge-pdf'
  switch (op) {
    case 'split-pdf':
      return <SplitPdfWorkspace op={op} onChangeOp={onChangeMerge} />
    case 'reorder-pdf':
      return <EditPdfPagesWorkspace op={op} onChangeOp={onChangeMerge} />
    case 'merge-pdf':
    default:
      return <MergePdfWorkspace op={op} onChangeOp={onChangeMerge} />
  }
}
