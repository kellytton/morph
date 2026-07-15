// Client-side image conversion via the Canvas API. Each converter takes a
// File/Blob and returns a converted Blob. Everything runs in the browser —
// no upload, no server. Kept framework-agnostic so it's easy to unit test.

import { encodeBMP, encodeICO } from './rasterEncoders'

// MIME type for each raster output format the canvas can encode natively.
const OUTPUT_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

// ICO is a favicon container — cap its dimensions to the format's 256px max.
const ICO_MAX = 256

/**
 * Decode an image source (File/Blob) into something drawable. Uses
 * createImageBitmap when available (fast, off-thread) and falls back to an
 * HTMLImageElement for formats/browsers where it's needed (e.g. SVG).
 */
async function decodeImage(blob) {
  // SVG must go through an <img> so the browser rasterizes the vector.
  const isSvg = blob.type === 'image/svg+xml'
  if (!isSvg && 'createImageBitmap' in window) {
    try {
      return await createImageBitmap(blob)
    } catch {
      // Fall through to the <img> path.
    }
  }

  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not decode this image.'))
      el.src = url
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function drawableSize(source) {
  return {
    width: source.width || source.naturalWidth,
    height: source.height || source.naturalHeight,
  }
}

/**
 * Core canvas encode. `to` is a lowercase format id. Handles native canvas
 * formats (png/jpg/webp) plus hand-rolled BMP and ICO. `quality` (0..1)
 * applies to lossy formats. Returns { blob, width, height }.
 */
async function encodeViaCanvas(source, to, opts) {
  // Default to {} for both undefined AND null (a null params object flows in
  // from optimize tasks that carry no quality) — `= {}` only catches undefined.
  const { quality = 0.92, background } = opts ?? {}
  let { width, height } = drawableSize(source)

  // ICO must fit within 256×256 — scale down proportionally if needed.
  if (to === 'ico' && Math.max(width, height) > ICO_MAX) {
    const scale = ICO_MAX / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // JPEG and BMP-as-photo have no useful alpha for some viewers; JPEG needs a
  // flattened background so transparency doesn't render as black.
  if (to === 'jpg' || to === 'jpeg') {
    ctx.fillStyle = background || '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(source, 0, 0, width, height)
  if (source.close) source.close() // release ImageBitmap

  // BMP: build from raw pixels for universal support.
  if (to === 'bmp') {
    const blob = encodeBMP(ctx.getImageData(0, 0, width, height))
    return { blob, width, height }
  }

  // ICO: encode to PNG first, then wrap in an ICO container.
  if (to === 'ico') {
    const pngBlob = await canvasToBlob(canvas, 'image/png')
    const blob = encodeICO(await pngBlob.arrayBuffer(), width, height)
    return { blob, width, height }
  }

  // Native canvas formats.
  const mime = OUTPUT_MIME[to]
  if (!mime) throw new Error(`Unsupported output format: ${to}`)
  const blob = await canvasToBlob(canvas, mime, quality)

  // Some browsers silently fall back to PNG if they can't encode a format
  // (notably older Safari + WebP/AVIF). Surface that instead of lying.
  if (blob.type !== mime) {
    throw new Error(`Your browser can't encode ${to.toUpperCase()} images.`)
  }

  return { blob, width, height }
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(`Failed to encode ${mime}.`))),
      mime,
      quality,
    ),
  )
}

/**
 * Build a converter for a raster→raster (or svg→raster) image conversion.
 * Returns an async fn (file, opts) => { blob, width, height }.
 */
export function makeImageConverter(to, defaults = {}) {
  return async (file, opts = {}) => {
    const source = await decodeImage(file)
    return encodeViaCanvas(source, to, { ...defaults, ...opts })
  }
}

/**
 * Compress an image in-place (same format). For lossy formats (jpg/webp/avif)
 * this re-encodes at the given quality for real size savings. Optionally
 * downscales via `maxDimension` (longest side, in px) which helps every format
 * including PNG. Returns { blob, width, height }.
 */
export function makeImageCompressor(format) {
  const mime = OUTPUT_MIME[format] || `image/${format}`
  return async (file, opts) => {
    // `= {}` guards undefined but not null; optimize tasks pass null params.
    const { quality = 0.7, maxDimension } = opts ?? {}
    const source = await decodeImage(file)
    let { width, height } = drawableSize(source)

    // Downscale if requested and the image exceeds the cap.
    if (maxDimension && Math.max(width, height) > maxDimension) {
      const scale = maxDimension / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(source, 0, 0, width, height)
    if (source.close) source.close()

    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error(`Failed to compress ${format}.`))),
        mime,
        quality,
      ),
    )
    return { blob, width, height }
  }
}
