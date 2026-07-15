import { useRef, useLayoutEffect } from 'react'

/**
 * FLIP animation for reorderable lists. Give each animated child a
 * `data-flip-id` attribute (a stable key), and pass this hook the container ref
 * plus the current ordered id array. When the order of the SAME items changes,
 * each item smoothly slides from its old position to its new one.
 *
 * Animation plays ONLY for a pure reorder — identical membership, different
 * sequence. Adding/removing items, switching modes, or resizing just records
 * fresh positions without animating, so nodes never "bounce in" from stale
 * coordinates.
 *
 * Two safeguards make this robust against the "bounce on first reorder" glitch:
 *   1. Positions are measured RELATIVE to the container, so if the whole grid
 *      shifts (page scroll, a header row above it reflowing when an async
 *      count/label lands) the shift cancels out — only real per-item deltas
 *      remain.
 *   2. The effect runs after EVERY render (no dep array) to keep the recorded
 *      positions current, but it skips re-measuring while an animation is in
 *      flight (a live transform would poison the next baseline).
 */
export function useFlipReorder(containerRef, ids, { duration = 240 } = {}) {
  const prevRects = useRef(new Map())
  const prevIds = useRef([])
  const animatingUntil = useRef(0)
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      prevIds.current = ids
      return
    }

    const before = prevIds.current
    const sameMembers =
      ids.length === before.length && ids.every((id) => before.includes(id))
    const reordered = sameMembers && ids.some((id, i) => id !== before[i])
    const animate = reordered && !reduced

    // While a reorder animation is still playing, a re-render for some other
    // reason must NOT re-measure: the transforms are mid-flight, so the boxes
    // would read as their translated (wrong) positions. Just keep the last
    // resting baseline and bail.
    const now =
      typeof performance !== 'undefined' && performance.now ? performance.now() : 0
    if (!animate && now < animatingUntil.current) {
      prevIds.current = ids
      return
    }

    const nodes = container.querySelectorAll('[data-flip-id]')

    // Starting a fresh animation: clear any leftover transform/transition so we
    // measure true resting positions and don't stack onto a prior transition.
    if (animate) {
      nodes.forEach((node) => {
        node.style.transition = 'none'
        node.style.transform = ''
      })
    }

    const base = container.getBoundingClientRect()
    const newRects = new Map()

    nodes.forEach((node) => {
      const id = node.getAttribute('data-flip-id')
      const r = node.getBoundingClientRect()
      const rect = { left: r.left - base.left, top: r.top - base.top }
      newRects.set(id, rect)

      if (!animate) return
      const prev = prevRects.current.get(id)
      if (!prev) return
      const dx = prev.left - rect.left
      const dy = prev.top - rect.top
      if (dx === 0 && dy === 0) return

      // Invert: jump back to the old spot instantly…
      node.style.transition = 'none'
      node.style.transform = `translate(${dx}px, ${dy}px)`
    })

    // …then Play: next frame, release everything to its real position at once.
    if (animate) {
      animatingUntil.current = now + duration
      requestAnimationFrame(() => {
        nodes.forEach((node) => {
          node.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
          node.style.transform = ''
        })
      })
    }

    prevRects.current = newRects
    prevIds.current = ids
  })
}
