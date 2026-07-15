import { useState, useRef } from 'react'
import { Box, Fade, Typography, Stack, Chip, Alert } from '@mui/material'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { UploadZone } from '../upload/UploadZone'
import { MergeWorkspaceHeader } from './MergeWorkspaceHeader'
import { PdfPageEditor } from './PdfPageEditor'
import { StickerButton } from '../common/StickerButton'
import { editPdfPages } from '../../converters/pdfConverters'
import { downloadBlob } from '../../utils/download'

/**
 * Edit PDF pages: render each page of a PDF as a thumbnail, then reorder,
 * rotate, and delete individual pages before exporting a new PDF. Supports
 * appending more PDFs — their pages join the same editable grid.
 */
export function EditPdfPagesWorkspace() {
  const [files, setFiles] = useState([])
  const [count, setCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [baseName, setBaseName] = useState('document')
  const editorRef = useRef(null)
  // Cancel just discards the in-flight result (browser work can't truly abort).
  const canceledRef = useRef(false)

  const addFiles = (incoming) => {
    const pdfs = incoming.filter((f) => f.type === 'application/pdf')
    if (!pdfs.length) return
    if (files.length === 0) setBaseName(pdfs[0].name.replace(/\.pdf$/i, '') || 'document')
    setError(null)
    setFiles((prev) => [...prev, ...pdfs])
  }

  const run = async () => {
    const pages = editorRef.current?.getPages() ?? []
    if (!pages.length) return
    setError(null)
    canceledRef.current = false
    setBusy(true)
    try {
      const { blob } = await editPdfPages(pages)
      if (canceledRef.current) return // canceled — discard
      downloadBlob(blob, `${baseName}-edited.pdf`)
    } catch (e) {
      if (!canceledRef.current) setError(e?.message ?? 'Something went wrong while saving.')
    } finally {
      setBusy(false)
    }
  }

  const cancel = () => {
    canceledRef.current = true
    setBusy(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { xs: 3, md: 6 } }}>
      <MergeWorkspaceHeader
        icon={<AutoFixHighRoundedIcon sx={{ color: 'text.primary' }} />}
        title="Edit PDF pages"
        subtitle="Reorder, rotate, and delete pages — then save a new PDF."
      />

      <Fade in timeout={400}>
        <Box>
          <UploadZone
            onFiles={addFiles}
            accept="application/pdf"
            hint={
              files.length
                ? 'Add another PDF to append its pages'
                : 'Drop a PDF to reorder, rotate, and delete its pages'
            }
          />
        </Box>
      </Fade>

      {error && <Alert role="alert" severity="error">{error}</Alert>}

      {files.length > 0 && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>Pages</Typography>
            {count > 0 && (
              <Chip size="small" label={`${count} page${count > 1 ? 's' : ''}`} sx={{ fontWeight: 600 }} />
            )}
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
                aria-label="Save PDF"
                startIcon={<SaveRoundedIcon sx={{ fontSize: 20 }} />}
                disabled={count === 0}
                onClick={run}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Save PDF</Box>
              </StickerButton>
            )}
          </Stack>

          <PdfPageEditor
            ref={editorRef}
            files={files}
            onError={setError}
            onCountChange={setCount}
          />
        </Stack>
      )}
    </Box>
  )
}
