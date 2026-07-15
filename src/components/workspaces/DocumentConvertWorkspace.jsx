import { useState } from 'react'
import { Box, Fade, Collapse, Alert } from '@mui/material'
import { UploadZone } from '../upload/UploadZone'
import { DocTargetSelector } from '../conversion/DocTargetSelector'
import { FormatCard } from '../conversion/FormatCard'
import { ConversionQueue } from '../queue/ConversionQueue'
import { useConversionQueue } from '../../hooks/useConversionQueue'
import { isPdfImageSource } from '../../converters/registry'
import { detectFormat } from '../../converters/detectFormat'
import { pdfToImages, imagesToPdf } from '../../converters/pdfConverters'

function desktopColumns(count) {
  if (count <= 3) return count
  if (count === 4) return 2
  return 3
}

/**
 * Document convert mode. Two flows depending on the target:
 *   • target is an image (PNG/JPG) → PDF → images: each PDF page becomes its
 *     own queue item (fan-out).
 *   • target is PDF → images → PDF: dropped images combine into one PDF.
 */
export function DocumentConvertWorkspace({ conversion, onChangeTarget }) {
  const queue = useConversionQueue()
  const { to } = conversion
  const pdfToImg = to !== 'pdf' // target is png/jpg → we're rendering a PDF
  const [notice, setNotice] = useState(null)

  const accept = pdfToImg ? 'application/pdf,.pdf' : 'image/png,image/jpeg,image/webp,image/bmp,image/gif'

  const handleFiles = (files) => {
    if (pdfToImg) handlePdfFiles(files)
    else handleImageFiles(files)
  }

  // PDF → images: one queue item per page.
  const handlePdfFiles = (files) => {
    const pdfs = []
    const rejected = []
    for (const f of files) (detectFormat(f) === 'pdf' ? pdfs : rejected).push(f)
    setNotice(
      rejected.length
        ? `${rejected.length} file${rejected.length > 1 ? 's' : ''} skipped — drop PDF files to convert to ${to.toUpperCase()}.`
        : null,
    )
    if (!pdfs.length) return

    for (const file of pdfs) {
      const base = file.name.replace(/\.pdf$/i, '')
      // A single "renderer" item first renders all pages, then we add one
      // completed item per page. To keep the queue granular AND show progress,
      // we render eagerly and enqueue per-page custom items that just slice
      // out their page's blob.
      renderPdfToQueue(file, base)
    }
  }

  const renderPdfToQueue = async (file, base) => {
    let pages
    try {
      pages = await pdfToImages(file, to)
    } catch {
      // Enqueue a single failed item so the user sees the error.
      queue.addCustom([
        { file, from: 'pdf', to, run: () => Promise.reject(new Error('Could not read this PDF.')) },
      ])
      return
    }
    queue.addCustom(
      pages.map((pg) => ({
        file,
        from: 'pdf',
        to,
        run: async ({ onProgress }) => {
          onProgress(1)
          return {
            blob: pg.blob,
            width: pg.width,
            height: pg.height,
            name: `${base}-page-${pg.page}.${to}`,
          }
        },
      })),
    )
  }

  // images → PDF: combine all dropped images into one PDF item.
  const handleImageFiles = (files) => {
    const imgs = []
    const rejected = []
    for (const f of files) {
      const fmt = detectFormat(f)
      ;(fmt && isPdfImageSource(fmt) ? imgs : rejected).push(f)
    }
    setNotice(
      rejected.length
        ? `${rejected.length} file${rejected.length > 1 ? 's' : ''} skipped — drop images to build a PDF.`
        : null,
    )
    if (!imgs.length) return

    const name = imgs.length === 1 ? imgs[0].name.replace(/\.[^.]+$/, '.pdf') : 'combined.pdf'
    // The queue item's `file` drives its thumbnail + name; use the first image.
    queue.addCustom([
      {
        file: imgs[0],
        from: detectFormat(imgs[0]) ?? 'png',
        to: 'pdf',
        run: async ({ onProgress }) => {
          const { blob } = await imagesToPdf(imgs, { onProgress })
          return { blob, width: 0, height: 0, name }
        },
      },
    ])
  }

  const hasUploaded = queue.items.length > 0
  const explainerFormats = pdfToImg ? ['pdf', to] : ['png', 'pdf']

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: { xs: 3, md: 6 } }}>
      <Fade in timeout={400}>
        <Box>
          <UploadZone
            onFiles={handleFiles}
            accept={accept}
            hint={
              pdfToImg
                ? `Drop a PDF — each page becomes a ${to.toUpperCase()} image.`
                : 'Drop images — we combine them into a single PDF.'
            }
            headingLevel="h1"
            footer={<DocTargetSelector to={to} onChangeTarget={(next) => onChangeTarget?.(next)} />}
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

      {!hasUploaded && (
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
