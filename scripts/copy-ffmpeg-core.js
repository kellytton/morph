// Copies the ffmpeg.wasm core (js + wasm) from node_modules into public/ffmpeg
// so it's served same-origin (required under COOP/COEP). The core is a large
// (~32MB) binary that lives in node_modules, so we don't commit it — this
// script restores it after install and before builds.
import { mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// The library's worker is a MODULE worker, so it loads the ESM core via
// dynamic import() — we must copy the ESM build (not UMD).
const coreSrc = resolve(root, 'node_modules/@ffmpeg/core/dist/esm')
const workerSrc = resolve(root, 'node_modules/@ffmpeg/ffmpeg/dist/esm')
const dest = resolve(root, 'public/ffmpeg')

if (!existsSync(resolve(coreSrc, 'ffmpeg-core.wasm'))) {
  console.warn('[copy-ffmpeg-core] @ffmpeg/core not found; skipping.')
  process.exit(0)
}

// Core wasm + ESM loader.
mkdirSync(dest, { recursive: true })
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  copyFileSync(resolve(coreSrc, file), resolve(dest, file))
}

// ffmpeg's ESM worker + its relative deps (const.js, errors.js, …). Served
// same-origin so classWorkerURL resolves and its imports load.
const workerDest = resolve(dest, 'worker')
mkdirSync(workerDest, { recursive: true })
for (const file of readdirSync(workerSrc)) {
  if (file.endsWith('.js')) copyFileSync(resolve(workerSrc, file), resolve(workerDest, file))
}

console.log('[copy-ffmpeg-core] copied core + worker to public/ffmpeg')
