// Map a File to our internal format id, preferring MIME type and falling
// back to the file extension. Used to auto-detect the conversion source from
// whatever the user drops, so the menu only needs to specify the target.

const MIME_TO_FORMAT = {
  // Images
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  // Video
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
  // Audio
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  // Documents
  'application/pdf': 'pdf',
}

const EXT_TO_FORMAT = {
  png: 'png', jpg: 'jpg', jpeg: 'jpg', webp: 'webp', avif: 'avif',
  gif: 'gif', bmp: 'bmp', svg: 'svg', ico: 'ico',
  mp4: 'mp4', mov: 'mov', webm: 'webm', mkv: 'mkv',
  mp3: 'mp3', wav: 'wav', ogg: 'ogg', flac: 'flac', m4a: 'm4a',
  pdf: 'pdf',
}

/** Best-effort format id for a File, or null if unrecognized. */
export function detectFormat(file) {
  if (!file) return null
  const byMime = MIME_TO_FORMAT[file.type]
  if (byMime) return byMime
  const ext = file.name?.split('.').pop()?.toLowerCase()
  return EXT_TO_FORMAT[ext] ?? null
}
