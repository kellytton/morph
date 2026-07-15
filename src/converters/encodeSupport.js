// Detects which image formats THIS browser can actually encode. Canvas
// silently falls back to PNG when it can't encode a requested MIME (notably
// AVIF, and WebP on older Safari), so we probe each once and cache the result.
//
// PNG/JPEG are guaranteed by the spec. BMP/ICO are hand-rolled from pixel
// data, so they never depend on the browser. Only WebP/AVIF need probing.

const PROBE_MIME = {
  webp: 'image/webp',
  avif: 'image/avif',
}

// Formats that are always supported (no probe needed).
const ALWAYS = new Set(['png', 'jpg', 'jpeg', 'bmp', 'ico'])

// Cache of format id -> boolean once resolved.
const cache = new Map()
let probePromise = null

// Synchronously probe via a tiny data URL (toDataURL returns the requested
// MIME only if supported; otherwise it returns image/png).
function probeSync(format) {
  const mime = PROBE_MIME[format]
  if (!mime) return true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const url = canvas.toDataURL(mime)
    return url.startsWith(`data:${mime}`)
  } catch {
    return false
  }
}

/**
 * Kick off capability detection. Safe to call repeatedly; resolves once.
 * Returns a promise so callers can await readiness if they want.
 */
export function ensureEncodeSupport() {
  if (probePromise) return probePromise
  probePromise = (async () => {
    for (const format of [...ALWAYS]) cache.set(format, true)
    for (const format of Object.keys(PROBE_MIME)) {
      cache.set(format, probeSync(format))
    }
  })()
  return probePromise
}

/**
 * True if the browser can encode `format`. Formats not in the raster set
 * (e.g. svg/gif) are not encodable by us and return false. Before detection
 * runs, optimistically assumes support so the UI doesn't flicker.
 */
export function canEncode(format) {
  if (cache.has(format)) return cache.get(format)
  // svg/gif are never encodable outputs here.
  if (format === 'svg' || format === 'gif') return false
  // Unknown-but-probeable: assume true until the probe resolves.
  return true
}

// Run detection eagerly at module load.
ensureEncodeSupport()
