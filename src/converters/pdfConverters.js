// Document conversions, fully client-side:
//   • PDF → PNG/JPG  — render each page to a canvas via pdf.js (one image
//     per page; the queue fans these out into separate items).
//   • images → PDF   — place each image on its own PDF page via pdf-lib.

import * as pdfjs from 'pdfjs-dist'
// Vite-resolved URL for pdf.js's worker. Set as the worker source so parsing
// runs off the main thread and survives bundling.
import pdfWorkerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, degrees } from 'pdf-lib'

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

/**
 * Merge several PDF files into one, preserving the given order. Each source
 * PDF's pages are appended whole. Returns { blob }.
 */
export async function mergePdfs(files, { onProgress } = {}) {
  const list = Array.isArray(files) ? files : [files]
  const out = await PDFDocument.create()

  for (let i = 0; i < list.length; i++) {
    const bytes = new Uint8Array(await list[i].arrayBuffer())
    const src = await PDFDocument.load(bytes)
    const pages = await out.copyPages(src, src.getPageIndices())
    pages.forEach((p) => out.addPage(p))
    onProgress?.((i + 1) / list.length)
  }

  const pdfBytes = await out.save()
  return { blob: new Blob([pdfBytes], { type: 'application/pdf' }) }
}

/**
 * Split one PDF into several. `ranges` is an array of { from, to } (1-based,
 * inclusive) page groups; each becomes its own PDF. When `ranges` is omitted,
 * every page is split into its own single-page PDF.
 *
 * Returns an array of { blob, label, pages } — one entry per output PDF.
 */
export async function splitPdf(file, { ranges, onProgress } = {}) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const src = await PDFDocument.load(bytes)
  const total = src.getPageCount()

  // Default: one PDF per page.
  const groups =
    ranges && ranges.length
      ? ranges
      : Array.from({ length: total }, (_, i) => ({ from: i + 1, to: i + 1 }))

  const results = []
  for (let g = 0; g < groups.length; g++) {
    const { from, to } = groups[g]
    // Clamp to the document and skip empty/invalid groups.
    const start = Math.max(1, Math.min(from, total))
    const end = Math.max(start, Math.min(to, total))
    const indices = []
    for (let p = start; p <= end; p++) indices.push(p - 1)

    const out = await PDFDocument.create()
    const copied = await out.copyPages(src, indices)
    copied.forEach((p) => out.addPage(p))
    const pdfBytes = await out.save()

    const label = start === end ? `page-${start}` : `pages-${start}-${end}`
    results.push({
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      label,
      pages: end - start + 1,
    })
    onProgress?.((g + 1) / groups.length)
  }

  return results
}

/**
 * Rebuild a PDF from an explicit ordered page list — the engine behind the
 * page editor. `pages` is an array of { file, page, rotate } where `page` is a
 * 1-based index into the ORIGINAL document(s) and `rotate` is degrees
 * (0/90/180/270) added to the page's existing rotation. Pages absent from the
 * array are dropped (deletion). Multiple source files are supported.
 *
 * Returns { blob }.
 */
export async function editPdfPages(pages, { onProgress } = {}) {
  const out = await PDFDocument.create()

  // Load + cache each distinct source document once.
  const cache = new Map()
  const load = async (file) => {
    if (!cache.has(file)) {
      const bytes = new Uint8Array(await file.arrayBuffer())
      cache.set(file, await PDFDocument.load(bytes))
    }
    return cache.get(file)
  }

  for (let i = 0; i < pages.length; i++) {
    const { file, page, rotate = 0 } = pages[i]
    const src = await load(file)
    const [copied] = await out.copyPages(src, [page - 1])
    if (rotate % 360 !== 0) {
      const current = copied.getRotation().angle
      copied.setRotation(degrees((current + rotate) % 360))
    }
    out.addPage(copied)
    onProgress?.((i + 1) / pages.length)
  }

  const pdfBytes = await out.save()
  return { blob: new Blob([pdfBytes], { type: 'application/pdf' }) }
}

/**
 * Render thumbnails for every page of a PDF, for the page editor. Returns an
 * array of { page, url, width, height } — `url` is an object URL for a small
 * PNG (revoke it when done). `maxEdge` caps the longest side in pixels.
 */
export async function pdfThumbnails(file, { maxEdge = 560, onProgress } = {}) {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const total = pdf.numPages
  const results = []

  try {
    for (let n = 1; n <= total; n++) {
      const page = await pdf.getPage(n)
      const base = page.getViewport({ scale: 1 })
      const scale = maxEdge / Math.max(base.width, base.height)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: ctx, viewport }).promise
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      results.push({
        page: n,
        url: URL.createObjectURL(blob),
        width: canvas.width,
        height: canvas.height,
      })
      onProgress?.(n / total)
      page.cleanup()
    }
  } finally {
    await pdf.destroy()
  }

  return results
}

/**
 * Render a single page of a PDF at high resolution — used by the page editor's
 * expand/lightbox view so the enlarged page stays sharp. `pageNumber` is
 * 1-based. Returns { url, width, height } (revoke `url` when done). `maxEdge`
 * caps the longest side in pixels.
 */
export async function renderPdfPage(file, pageNumber, { maxEdge = 2000 } = {}) {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  try {
    const page = await pdf.getPage(pageNumber)
    const base = page.getViewport({ scale: 1 })
    const scale = maxEdge / Math.max(base.width, base.height)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    page.cleanup()
    return { url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height }
  } finally {
    await pdf.destroy()
  }
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
