import { useCallback, useRef, useState } from 'react'
import { convert, compress, OUTPUT_EXTENSION } from '../converters/registry'
import { downloadBlob, downloadZip } from '../utils/download'

let idCounter = 0
const nextId = () => `q${++idCounter}`

// Item status lifecycle.
export const STATUS = {
  PENDING: 'pending',
  CONVERTING: 'converting',
  DONE: 'done',
  ERROR: 'error',
  CANCELED: 'canceled',
}

// Swap a filename's extension for the target format's extension.
function outputName(filename, to) {
  const ext = OUTPUT_EXTENSION[to] ?? to
  const dot = filename.lastIndexOf('.')
  const base = dot === -1 ? filename : filename.slice(0, dot)
  return `${base}.${ext}`
}

// Compressed output keeps its extension but is tagged "-min".
function compressedName(filename) {
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return `${filename}-min`
  return `${filename.slice(0, dot)}-min${filename.slice(dot)}`
}

/**
 * Owns the conversion queue: adding files, running conversions with animated
 * progress, cancel/retry, and downloads (single + batch ZIP). Conversions run
 * one at a time to keep the main thread responsive on large batches.
 *
 * Each item: { id, file, from, to, status, progress, result, error, outName }
 */
export function useConversionQueue() {
  const [items, setItems] = useState([])
  // Track canceled ids so an in-flight conversion can bail on completion.
  const canceledRef = useRef(new Set())

  const patch = useCallback((id, changes) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...changes } : it)),
    )
  }, [])

  // Smoothly animate progress up to `cap` while the (fast) canvas work runs,
  // so the bar feels alive rather than snapping 0→100.
  const animateProgress = useCallback(
    (id, cap = 90) => {
      let p = 0
      const timer = setInterval(() => {
        p = Math.min(cap, p + Math.random() * 18 + 6)
        patch(id, { progress: p })
        if (p >= cap) clearInterval(timer)
      }, 90)
      return () => clearInterval(timer)
    },
    [patch],
  )

  const runItem = useCallback(
    async (item) => {
      const { id, file, from, to, mode, params, run } = item
      canceledRef.current.delete(id)
      patch(id, { status: STATUS.CONVERTING, progress: 0, error: null })

      // Custom-run items (e.g. document tasks that fan out / combine files)
      // own their conversion. They report progress + return { blob, name,
      // width, height }.
      if (run) {
        try {
          const onProgress = (p) => patch(id, { progress: Math.round(p * 100) })
          const result = await run({ onProgress })
          if (canceledRef.current.has(id)) return
          patch(id, {
            status: STATUS.DONE,
            progress: 100,
            result: { ...result, size: result.blob.size },
          })
        } catch (err) {
          if (canceledRef.current.has(id)) return
          patch(id, { status: STATUS.ERROR, progress: 0, error: err?.message || 'Conversion failed.' })
        }
        return
      }

      // Media conversions (ffmpeg) report REAL progress, so we drive the bar
      // from the engine. Fast canvas image work uses a simulated ramp instead.
      const isMedia = Boolean(params?.isMedia)
      const stop = isMedia ? () => {} : animateProgress(id)
      const runParams = isMedia
        ? { ...params, onProgress: (p) => patch(id, { progress: Math.round(p * 100) }) }
        : params

      try {
        // Branch by task type: compress/optimize (same format) vs convert
        // (from→to). Both accept params (e.g. { quality }).
        let { blob, width, height } =
          mode === 'compress'
            ? await compress(from, file, runParams ?? {})
            : await convert(from, to, file, runParams ?? {})
        stop()
        if (canceledRef.current.has(id)) return

        // "Never make it bigger": when the output keeps the same format
        // (optimize/compress, or a convert where to === from), re-encoding can
        // occasionally produce a LARGER file than the original — an already
        // well-compressed input has nothing to squeeze. In that case keep the
        // original bytes so the user is never handed a worse file.
        const sameFormat = mode === 'compress' || to === from
        let optimal = false
        if (sameFormat && blob.size >= file.size) {
          blob = file
          optimal = true
        }

        patch(id, {
          status: STATUS.DONE,
          progress: 100,
          result: {
            blob,
            width,
            height,
            size: blob.size,
            optimal,
            name: mode === 'compress' ? compressedName(file.name) : outputName(file.name, to),
          },
        })
      } catch (err) {
        stop()
        if (canceledRef.current.has(id)) return
        patch(id, {
          status: STATUS.ERROR,
          progress: 0,
          error: err?.message || 'Conversion failed.',
        })
      }
    },
    [patch, animateProgress],
  )

  /**
   * Add files and start processing them. `task` is either a conversion
   * ({ from, to }) or a compression ({ mode: 'compress', from, params }).
   * `from` may be a string or a per-file resolver (file) => formatId, letting
   * convert auto-detect each file's source format.
   */
  const addFiles = useCallback(
    (files, task) => {
      const { from, to, mode, params } = task
      const resolveFrom = typeof from === 'function' ? from : () => from
      const created = files.map((file) => {
        const f = resolveFrom(file)
        return {
          id: nextId(),
          file,
          from: f,
          to: to ?? f,
          mode: mode ?? 'convert',
          params: params ?? null,
          status: STATUS.PENDING,
          progress: 0,
          result: null,
          error: null,
        }
      })
      setItems((prev) => [...prev, ...created])
      // Kick off conversions sequentially.
      ;(async () => {
        for (const item of created) {
          await runItem(item)
        }
      })()
    },
    [runItem],
  )

  /**
   * Add custom queue items that own their own conversion (used by documents,
   * which fan out/combine files). Each entry: { file, from, to, run } where
   * `run({ onProgress }) => { blob, name, width?, height? }`.
   */
  const addCustom = useCallback(
    (entries) => {
      const created = entries.map((e) => ({
        id: nextId(),
        file: e.file,
        from: e.from,
        to: e.to,
        mode: e.mode ?? 'convert',
        run: e.run,
        params: null,
        status: STATUS.PENDING,
        progress: 0,
        result: null,
        error: null,
      }))
      setItems((prev) => [...prev, ...created])
      ;(async () => {
        for (const item of created) {
          await runItem(item)
        }
      })()
    },
    [runItem],
  )

  const cancelItem = useCallback(
    (id) => {
      canceledRef.current.add(id)
      patch(id, { status: STATUS.CANCELED, progress: 0 })
    },
    [patch],
  )

  const retryItem = useCallback(
    (id) => {
      setItems((prev) => {
        const item = prev.find((it) => it.id === id)
        if (item) runItem(item)
        return prev
      })
    },
    [runItem],
  )

  const removeItem = useCallback((id) => {
    canceledRef.current.add(id)
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => canceledRef.current.add(it.id))
      return []
    })
  }, [])

  const downloadOne = useCallback((item) => {
    if (item.result) downloadBlob(item.result.blob, item.result.name)
  }, [])

  const downloadAll = useCallback(() => {
    const done = items.filter((it) => it.status === STATUS.DONE && it.result)
    if (done.length === 0) return
    if (done.length === 1) {
      downloadBlob(done[0].result.blob, done[0].result.name)
      return
    }
    downloadZip(
      done.map((it) => ({ blob: it.result.blob, filename: it.result.name })),
    )
  }, [items])

  return {
    items,
    addFiles,
    addCustom,
    cancelItem,
    retryItem,
    removeItem,
    clear,
    downloadOne,
    downloadAll,
  }
}
