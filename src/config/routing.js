// URL <-> app-state mapping. The app is a single page whose "route" is just the
// active mode + that mode's selection, reflected in query params so links can
// open a specific tool in a new tab, be bookmarked, and work with Back/Forward.
//
// Schemes:
//   convert (target):   ?mode=convert&to=webp
//   convert (document): ?mode=convert&from=pdf&to=png   (both carried)
//   compress:           ?mode=compress&format=webp
//   merge:              ?mode=merge&op=split-pdf

import {
  DEFAULT_CONVERSION,
  DEFAULT_COMPRESS,
  DEFAULT_MERGE,
  MERGE_MENU,
  convertItemToConversion,
} from './conversions'

const VALID_MODES = new Set(['convert', 'compress', 'merge'])

// The app is a single page served at the site root. Any other path is unknown
// (→ 404). Tolerate a base-path deploy by allowing the configured BASE_URL, and
// treat a bare "" / "/index.html" as root too.
export function isKnownPath(pathname = window.location.pathname) {
  const base = import.meta.env.BASE_URL || '/'
  const roots = new Set([base, base.replace(/\/$/, ''), '/', '', '/index.html', `${base}index.html`])
  return roots.has(pathname)
}

// Look up a merge op's label from config so a deep-linked merge selection has
// the same label the menu would give it.
function mergeLabelFor(op) {
  for (const cat of MERGE_MENU) {
    const found = cat.items.find((it) => it.op === op)
    if (found) return found.label
  }
  return undefined
}

/**
 * Parse the current location's query into { mode, conversion, compressSel,
 * mergeSel }. Missing/invalid params fall back to the defaults, so a bare `/`
 * lands on the default convert view.
 */
export function parseLocation(search = window.location.search) {
  const q = new URLSearchParams(search)
  const rawMode = q.get('mode')
  const mode = VALID_MODES.has(rawMode) ? rawMode : 'convert'

  const state = {
    mode,
    conversion: DEFAULT_CONVERSION,
    compressSel: DEFAULT_COMPRESS,
    mergeSel: DEFAULT_MERGE,
  }

  if (mode === 'convert') {
    const to = q.get('to')
    const from = q.get('from')
    if (to) state.conversion = from ? { from, to } : convertItemToConversion({ target: to })
  } else if (mode === 'compress') {
    const format = q.get('format')
    if (format) state.compressSel = { format }
  } else if (mode === 'merge') {
    const op = q.get('op')
    if (op) state.mergeSel = { op, label: mergeLabelFor(op) }
  }

  return state
}

/** Build the query string (including leading "?") for a given mode + selection. */
export function buildSearch({ mode, conversion, compressSel, mergeSel }) {
  const q = new URLSearchParams()
  q.set('mode', mode)
  if (mode === 'convert') {
    if (conversion?.to) q.set('to', conversion.to)
    // Document conversions (pdf↔images) depend on the source too, so carry it.
    if (conversion?.from === 'pdf' || conversion?.to === 'pdf') {
      if (conversion?.from) q.set('from', conversion.from)
    }
  } else if (mode === 'compress') {
    if (compressSel?.format) q.set('format', compressSel.format)
  } else if (mode === 'merge') {
    if (mergeSel?.op) q.set('op', mergeSel.op)
  }
  return `?${q.toString()}`
}

/** A relative href ("/?mode=...") for a menu item in a given section. */
export function hrefForSelection(section, selection) {
  if (section === 'convert') return `/${buildSearch({ mode: 'convert', conversion: selection })}`
  if (section === 'compress') return `/${buildSearch({ mode: 'compress', compressSel: selection })}`
  if (section === 'merge') return `/${buildSearch({ mode: 'merge', mergeSel: selection })}`
  return '/'
}
