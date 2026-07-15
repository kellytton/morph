// Media conversion recipes (ffmpeg arg lists) and the converter factory.
// Everything runs through the lazy-loaded ffmpeg.wasm engine.

import { runFFmpeg } from './ffmpegEngine'

// Output MIME per media format.
export const MEDIA_MIME = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  gif: 'image/gif',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
}

// File extension per format (usually the id itself).
export const MEDIA_EXT = {
  mp4: 'mp4', mov: 'mov', webm: 'webm', mkv: 'mkv', gif: 'gif',
  mp3: 'mp3', wav: 'wav', ogg: 'ogg', flac: 'flac', m4a: 'm4a',
}

// Which formats are video vs audio (drives default recipes + UI grouping).
export const VIDEO_FORMATS = new Set(['mp4', 'mov', 'webm', 'mkv', 'gif'])
export const AUDIO_FORMATS = new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a'])

export function isVideo(format) {
  return VIDEO_FORMATS.has(format)
}
export function isAudio(format) {
  return AUDIO_FORMATS.has(format)
}

// Build the ffmpeg arg list for a given from→to. `opts` may carry tuning like
// { fps, width, crf } for video→gif / compression.
function buildArgs(from, to, input, output, opts = {}) {
  // Video → animated GIF: scale down + cap fps, with a palette pass for
  // quality. (Single-pass palettegen via filter for simplicity/speed.)
  if (to === 'gif') {
    const fps = opts.fps ?? 12
    const width = opts.width ?? 480
    return [
      '-i', input,
      '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
      '-loop', '0',
      output,
    ]
  }

  // Audio → audio: let ffmpeg pick the encoder from the output extension,
  // with sensible bitrates for lossy targets.
  if (AUDIO_FORMATS.has(to)) {
    const args = ['-i', input, '-vn']
    if (to === 'mp3') args.push('-b:a', opts.audioBitrate ?? '192k')
    if (to === 'ogg') args.push('-q:a', '5')
    if (to === 'm4a') args.push('-b:a', opts.audioBitrate ?? '192k')
    // wav/flac are lossless — no bitrate flag needed.
    args.push(output)
    return args
  }

  // Video → video (format swap or compression). H.264 for mp4/mov/mkv,
  // VP9 for webm. `crf` controls quality/size (lower = better/bigger).
  const crf = String(opts.crf ?? 26)
  if (to === 'webm') {
    return ['-i', input, '-c:v', 'libvpx-vp9', '-crf', crf, '-b:v', '0', '-c:a', 'libopus', output]
  }
  // mp4 / mov / mkv
  return [
    '-i', input,
    '-c:v', 'libx264', '-crf', crf, '-preset', opts.preset ?? 'veryfast',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    output,
  ]
}

/**
 * Build a media converter for a from→to pair. Returns an async fn
 * (file, { onProgress, ...opts }) => { blob }.
 */
export function makeMediaConverter(from, to) {
  return async (file, opts = {}) => {
    const input = `input.${MEDIA_EXT[from] ?? from}`
    const output = `output.${MEDIA_EXT[to] ?? to}`
    const args = buildArgs(from, to, input, output, opts)
    const blob = await runFFmpeg({
      file,
      inputName: input,
      outputName: output,
      args,
      outputMime: MEDIA_MIME[to] ?? 'application/octet-stream',
      onProgress: opts.onProgress,
    })
    return { blob, width: 0, height: 0 }
  }
}

/**
 * Build a same-format media compressor (video: raise CRF; audio: lower
 * bitrate). Returns (file, { quality (0..1), onProgress }) => { blob }.
 */
export function makeMediaCompressor(format) {
  return async (file, opts = {}) => {
    const q = opts.quality ?? 0.6
    const input = `input.${MEDIA_EXT[format] ?? format}`
    const output = `output.${MEDIA_EXT[format] ?? format}`
    // Map quality → codec params. Lower quality = smaller file.
    const tuneOpts = isVideo(format)
      ? { crf: Math.round(40 - q * 22) } // q=1→18, q=0→40
      : { audioBitrate: `${Math.round(64 + q * 256)}k` } // 64k..320k
    const args = buildArgs(format, format, input, output, tuneOpts)
    const blob = await runFFmpeg({
      file,
      inputName: input,
      outputName: output,
      args,
      outputMime: MEDIA_MIME[format] ?? 'application/octet-stream',
      onProgress: opts.onProgress,
    })
    return { blob, width: 0, height: 0 }
  }
}
