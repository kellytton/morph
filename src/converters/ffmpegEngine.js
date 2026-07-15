// Lazy-loaded ffmpeg.wasm engine. The ~25MB core is loaded on first media use
// (not at app start) and cached for the session. All media conversions run
// fully in-browser. Cross-origin isolation (COOP/COEP) is set up in the Vite
// config; production hosting must send the same headers.

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

// All ffmpeg assets are served same-origin from /ffmpeg (copied out of
// node_modules by scripts/copy-ffmpeg-core.js). Passing an explicit
// classWorkerURL avoids the library's internal `new URL('./worker.js',
// import.meta.url)` lookup, which breaks once the app is bundled.
const CORE_URL = '/ffmpeg/ffmpeg-core.js'
const WASM_URL = '/ffmpeg/ffmpeg-core.wasm'
const WORKER_URL = '/ffmpeg/worker/worker.js'

let ffmpeg = null
let loadPromise = null

// Subscribers for load progress (0..1) while the core downloads.
const loadListeners = new Set()

/** Subscribe to core-download progress; returns an unsubscribe fn. */
export function onEngineLoadProgress(fn) {
  loadListeners.add(fn)
  return () => loadListeners.delete(fn)
}

/** True once the engine core is loaded and ready. */
export function isEngineReady() {
  return Boolean(ffmpeg?.loaded)
}

/**
 * Ensure the ffmpeg core is loaded (idempotent). Returns the FFmpeg instance.
 * The first call triggers the core download; subsequent calls resolve instantly.
 */
export async function ensureEngine() {
  if (ffmpeg?.loaded) return ffmpeg
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const instance = new FFmpeg()

    // Report download progress of the wasm core to any listeners.
    instance.on('progress', () => {}) // conversion progress handled per-run
    // The loader doesn't emit granular download %, so we surface coarse states.
    notifyLoad(0.05)

    await instance.load({
      classWorkerURL: new URL(WORKER_URL, window.location.origin).href,
      coreURL: CORE_URL,
      wasmURL: WASM_URL,
    })
    notifyLoad(1)
    ffmpeg = instance
    return instance
  })()

  return loadPromise
}

function notifyLoad(p) {
  for (const fn of loadListeners) fn(p)
}

/**
 * Run a media conversion. `args` is the ffmpeg CLI arg list (excluding the
 * program name), referencing `inputName` / `outputName` as virtual FS paths.
 * `onProgress(0..1)` receives conversion progress. Returns a Blob of the output.
 */
export async function runFFmpeg({ file, inputName, outputName, args, outputMime, onProgress }) {
  const engine = await ensureEngine()

  const handleProgress = ({ progress }) => {
    if (onProgress && Number.isFinite(progress)) {
      onProgress(Math.max(0, Math.min(1, progress)))
    }
  }
  engine.on('progress', handleProgress)

  try {
    await engine.writeFile(inputName, await fetchFile(file))
    // exec() resolves to undefined on success and throws on failure in
    // @ffmpeg 0.12 — so we don't check a return code, just let it throw.
    await engine.exec(args)

    const data = await engine.readFile(outputName)
    if (!data || data.length === 0) throw new Error('Media conversion produced no output.')
    // `data` is a Uint8Array — wrap directly in a Blob of the right type.
    return new Blob([data], { type: outputMime })
  } finally {
    engine.off('progress', handleProgress)
    // Clean up the virtual FS so repeated runs don't leak memory.
    await engine.deleteFile(inputName).catch(() => {})
    await engine.deleteFile(outputName).catch(() => {})
  }
}
