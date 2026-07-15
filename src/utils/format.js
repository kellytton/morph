/** Human-readable file size, e.g. 1536 → "1.5 KB". */
export function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`
}

/** Signed percentage change from `before` to `after`, e.g. -42 (%). */
export function percentChange(before, after) {
  if (!before) return 0
  return Math.round(((after - before) / before) * 100)
}
