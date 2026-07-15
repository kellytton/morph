// Document conversions, fully client-side:
//   • PDF → PNG/JPG  — render each page to a canvas via pdf.js (one image
//     per page; the queue fans these out into separate items).
//   • images → PDF   — place each image on its own PDF page via pdf-lib.

import * as pdfjs from 'pdfjs-dist'
// Vite-resolved URL for pdf.js's worker. Set as the worker source so parsing
// runs off the main thread and survives bundling.
import pdfWorkerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument } from 'pdf-lib'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerURL

// Render scale — higher = sharper output images, larger files. 2x is a good
// default for readable page renders.
const RENDER_SCALE = 2

/**
 * Render every page of a PDF to an image blob. Returns an array of
 * { blob, width, height, page } — one entry per page. `to` is 'png' | 'jpg'.
 */
export async function pdfToImages(file, to = 'png', { onProgress } = {}) {
  const mime = to === 'jpg' || to === 'jpeg' ? 'image/jpeg' : 'image/png'
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const total = pdf.numPages
  const results = []

  try {
    for (let n = 1; n <= total; n++) {
      const page = await pdf.getPage(n)
      const viewport = page.getViewport({ scale: RENDER_SCALE })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')

      // JPEG has no alpha — paint a white page background first.
      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      await page.render({ canvasContext: ctx, viewport }).promise
      const blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to render page.'))), mime, 0.92),
      )
      results.push({ blob, width: canvas.width, height: canvas.height, page: n })
      onProgress?.(n / total)
      page.cleanup()
    }
  } finally {
    await pdf.destroy()
  }

  return results
}

/**
 * Build a single PDF from one or more images. Each image becomes a page sized
 * to its pixel dimensions. Returns { blob }.
 */
export async function imagesToPdf(files, { onProgress } = {}) {
  const doc = await PDFDocument.create()
  const list = Array.isArray(files) ? files : [files]

  for (let i = 0; i < list.length; i++) {
    const file = list[i]
    const bytes = new Uint8Array(await file.arrayBuffer())
    const type = file.type

    let image
    if (type === 'image/png') {
      image = await doc.embedPng(bytes)
    } else if (type === 'image/jpeg') {
      image = await doc.embedJpg(bytes)
    } else {
      // pdf-lib only embeds PNG/JPEG — rasterize anything else to PNG first.
      const png = await rasterizeToPng(file)
      image = await doc.embedPng(png)
    }

    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    onProgress?.((i + 1) / list.length)
  }

  const pdfBytes = await doc.save()
  return { blob: new Blob([pdfBytes], { type: 'application/pdf' }) }
}

// Rasterize an arbitrary image file to PNG bytes (for pdf-lib embedding).
async function rasterizeToPng(file) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d').drawImage(bitmap, 0, 0)
  bitmap.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  return new Uint8Array(await blob.arrayBuffer())
}
