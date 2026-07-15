import { useCallback, useState } from 'react'

/**
 * useState mirror that persists to localStorage under `key`.
 * SSR-safe and resilient to unavailable/blocked storage.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // Ignore write failures (private mode, quota, etc.)
        }
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}
