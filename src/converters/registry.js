// Central converter registry. Maps a conversion (from → to) to an async
// converter fn. The UI asks this module "can you do X→Y?" and "do it",
// staying decoupled from *how* each conversion works. Adding a new converter
// (e.g. a PDF or ffmpeg-backed one) is a matter of registering it here.

import { makeImageConverter, makeImageCompressor } from './imageConverters'
import { canEncode } from './encodeSupport'
import {
  makeMediaConverter,
  makeMediaCompressor,
  MEDIA_EXT,
  VIDEO_FORMATS,
  AUDIO_FORMATS,
  isVideo as isVideoFormat,
  isAudio as isAudioFormat,
} from './mediaConverters'

// Formats we can decode as an image source (canvas-drawable inputs).
const IMAGE_INPUTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'avif', 'bmp', 'gif', 'svg', 'ico'])
// Formats we can encode to (png/jpg/webp native; bmp/ico hand-rolled).
const IMAGE_OUTPUTS = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'ico']

// File extension to use when saving each output format.
export const OUTPUT_EXTENSION = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  webp: 'webp',
  bmp: 'bmp',
  ico: 'ico',
}

// Registry keyed by `${from}->${to}`.
const registry = new Map()

function key(from, to) {
  return `${from}->${to}`
}

/** Register a converter fn for a from→to pair. */
export function register(from, to, fn) {
  registry.set(key(from, to), fn)
}

// Auto-register every supported image input → image output combination.
// Same-format pairs (e.g. webp→webp) ARE registered as a re-encode, so
// uploading a file that already matches the target still works (it's just
// re-saved / optimized rather than rejected).
for (const from of IMAGE_INPUTS) {
  for (const to of IMAGE_OUTPUTS) {
    register(from, to, makeImageConverter(to))
  }
}

// --- Media (ffmpeg.wasm) ---------------------------------------------------

// Valid media conversions. Video sources go to any video/gif target; audio
// sources go to any audio target. (Video→audio "extract" is possible but kept
// out for now to keep the menu focused.)
const VIDEO_TARGETS = ['mp4', 'mov', 'webm', 'gif']
const AUDIO_TARGETS = ['mp3', 'wav', 'ogg', 'm4a']
const VIDEO_SOURCES = ['mp4', 'mov', 'webm', 'mkv']
const AUDIO_SOURCES = ['mp3', 'wav', 'ogg', 'flac', 'm4a']

for (const from of VIDEO_SOURCES) {
  for (const to of VIDEO_TARGETS) {
    register(from, to, makeMediaConverter(from, to))
  }
}
for (const from of AUDIO_SOURCES) {
  for (const to of AUDIO_TARGETS) {
    register(from, to, makeMediaConverter(from, to))
  }
}

// Add media extensions to the output-extension map.
Object.assign(OUTPUT_EXTENSION, MEDIA_EXT)

/** True if the given conversion pair has a registered converter. */
export function canConvert(from, to) {
  if (!from || !to) return false
  return registry.has(key(from, to))
}

// --- Compression -----------------------------------------------------------

// Image formats we can meaningfully compress in-browser (lossy re-encode).
const COMPRESSIBLE = new Set(['jpg', 'jpeg', 'webp', 'avif', 'png'])
const compressors = new Map()
for (const format of COMPRESSIBLE) {
  compressors.set(format, makeImageCompressor(format === 'jpg' ? 'jpg' : format))
}

// Media compressors (same-format re-encode at lower quality via ffmpeg).
const MEDIA_COMPRESSIBLE = new Set(['mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg', 'm4a'])
for (const format of MEDIA_COMPRESSIBLE) {
  compressors.set(format, makeMediaCompressor(format))
}

/** True if we can compress the given format in-browser. */
export function canCompress(format) {
  return compressors.has(format)
}

/**
 * Compress a file of `format` (same format out). `opts` accepts
 * { quality, maxDimension }. Returns { blob, width, height }.
 */
export async function compress(format, file, opts = {}) {
  const fn = compressors.get(format)
  if (!fn) throw new Error(`Compressing ${format?.toUpperCase()} isn't available yet.`)
  return fn(file, opts)
}

// Image formats offered in the chip pickers (menu-facing ids; 'jpeg' is
// folded into 'jpg'). Order controls how they appear in the picker.
const PICKABLE_IMAGE_FORMATS = ['png', 'jpg', 'webp', 'avif', 'svg', 'gif', 'bmp', 'ico']

// Image formats we can produce as OUTPUT (the convert menu's targets).
export const TARGET_IMAGE_FORMATS = ['webp', 'png', 'jpg', 'avif', 'bmp', 'ico']

// Lossy formats — a quality setting meaningfully affects their output size.
// Lossless formats (png/bmp/ico) ignore quality, so no control is shown.
const LOSSY_FORMATS = new Set(['jpg', 'jpeg', 'webp', 'avif'])

/** True if `format` is a lossy encoder (quality slider is meaningful). */
export function isLossy(format) {
  return LOSSY_FORMATS.has(format)
}

/** True if `format` is an image we can decode as a conversion source. */
export function isImageInput(format) {
  return IMAGE_INPUTS.has(format)
}

/** Formats that can be produced as output. */
export function targetFormats() {
  return TARGET_IMAGE_FORMATS
}

/** The list of image formats a user can pick in a chip. */
export function imageFormats() {
  return PICKABLE_IMAGE_FORMATS
}

// The set of formats we can even attempt to encode (image outputs only).
const ENCODABLE_IMAGE_OUTPUTS = new Set(IMAGE_OUTPUTS)

/**
 * True if this browser can produce `format` as an encoded image output. Gates
 * on our image-output set first, so non-image targets (pdf/mp4/…) are never
 * reported as encodable even though the raw capability probe is optimistic.
 */
export function isEncodable(format) {
  return ENCODABLE_IMAGE_OUTPUTS.has(format) && canEncode(format)
}

/**
 * Options to show in a format picker (minus the chip's own current value).
 *
 * `role` is 'source' | 'target'. A TARGET picker only lists formats we can
 * actually produce — unencodable ones (svg/gif, or AVIF where unsupported) are
 * omitted entirely, since offering a destination you can never pick is just
 * clutter. A SOURCE picker lists every image format.
 *
 * Returns [{ id }].
 */
export function pickerOptions(current, role) {
  return PICKABLE_IMAGE_FORMATS.filter((id) => {
    if (id === current) return false
    if (role === 'target' && !isEncodable(id)) return false
    return true
  }).map((id) => ({ id }))
}

/**
 * Formats that `from` can be converted INTO (encodable targets). Used to
 * validate/repair a pairing after a change.
 */
export function targetsFor(from) {
  return PICKABLE_IMAGE_FORMATS.filter((to) => to !== from && canConvert(from, to))
}

/**
 * Formats that can be converted INTO `to` (i.e. valid sources). Used to
 * validate/repair a pairing after a change.
 */
export function sourcesFor(to) {
  return PICKABLE_IMAGE_FORMATS.filter((from) => from !== to && canConvert(from, to))
}

// --- Media helpers ---------------------------------------------------------

/** True if `format` is a media (video or audio) format we handle. */
export function isMediaFormat(format) {
  return VIDEO_FORMATS.has(format) || AUDIO_FORMATS.has(format)
}

export { isVideoFormat as isVideo, isAudioFormat as isAudio }

// Media targets grouped by family, for the media convert menu / picker.
const VIDEO_TARGETS_LIST = ['mp4', 'webm', 'mov', 'gif']
const AUDIO_TARGETS_LIST = ['mp3', 'wav', 'ogg', 'm4a']

/**
 * Valid conversion targets for a media source: same family only (video→video/
 * gif, audio→audio), excluding the source itself.
 */
export function mediaTargetsFor(from) {
  const list = isVideoFormat(from) ? VIDEO_TARGETS_LIST : isAudioFormat(from) ? AUDIO_TARGETS_LIST : []
  return list.filter((to) => to !== from && canConvert(from, to))
}

/** Media target options for a picker: [{ id }] within the source's family. */
export function mediaPickerOptions(from, current) {
  // Offer every target in the family except the current selection.
  const list = isVideoFormat(from) || VIDEO_FORMATS.has(current)
    ? VIDEO_TARGETS_LIST
    : AUDIO_TARGETS_LIST
  return list.filter((id) => id !== current).map((id) => ({ id }))
}

// --- Document helpers ------------------------------------------------------
// Documents don't fit the 1:1 converter model (PDF→images fans OUT to many
// images; images→PDF fans IN to one PDF), so the document workspace calls the
// pdf converters directly. These helpers just describe capability + targets.

// Image formats we can turn a PDF into, and can build a PDF from.
const PDF_IMAGE_TARGETS = ['png', 'jpg']
const PDF_IMAGE_SOURCES = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif']

/** True if `format` is a document format we handle (currently just PDF). */
export function isDocFormat(format) {
  return format === 'pdf'
}

/** Valid targets when converting a PDF (→ images). */
export function pdfImageTargets() {
  return PDF_IMAGE_TARGETS
}

/** True if an image `format` can be a source for image→PDF. */
export function isPdfImageSource(format) {
  return PDF_IMAGE_SOURCES.includes(format)
}

/**
 * Run a conversion. Returns { blob, width, height }. Throws if unsupported
 * or if the browser can't perform it. `opts` is passed to the converter
 * (e.g. { quality, onProgress }).
 */
export async function convert(from, to, file, opts = {}) {
  const fn = registry.get(key(from, to))
  if (!fn) throw new Error(`Conversion ${from?.toUpperCase()} → ${to?.toUpperCase()} isn't available yet.`)
  return fn(file, opts)
}
