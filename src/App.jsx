import { useState, useEffect, useRef } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { convertItemToConversion } from './config/conversions'
import { parseLocation, buildSearch, isKnownPath } from './config/routing'

export default function App() {
  // Initial state comes from the URL, so deep links (and new-tab links from the
  // menus) land on the right tool.
  const initial = parseLocation()
  // The active tool mode and its per-mode selection.
  const [mode, setMode] = useState(initial.mode)
  // Convert is target-oriented: `to` is the real choice; `from` is only a
  // preview seed (each file's real source is auto-detected on upload).
  const [conversion, setConversion] = useState(initial.conversion)
  const [compressSel, setCompressSel] = useState(initial.compressSel)
  const [mergeSel, setMergeSel] = useState(initial.mergeSel)
  // The app lives entirely at "/"; any other path is a 404. Tracked in state so
  // Back/Forward and the in-app home link update it without a reload.
  const [notFound, setNotFound] = useState(!isKnownPath(window.location.pathname))

  // Keep the URL in sync with the current mode + selection (replaceState, so we
  // don't spam history on every in-app switch). Guard against writing back a URL
  // that already matches — and against echoing a popstate we just applied.
  const skipNextSync = useRef(false)
  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }
    // On a 404 path, leave the URL alone so the wrong address stays visible and
    // isn't silently rewritten to a valid one.
    if (notFound) return
    const search = buildSearch({ mode, conversion, compressSel, mergeSel })
    if (search !== window.location.search) {
      window.history.replaceState(null, '', search)
    }
  }, [mode, conversion, compressSel, mergeSel, notFound])

  // Back/Forward (and the logo's "/" link, which pushes state): re-read the URL
  // and apply it without writing it straight back.
  useEffect(() => {
    const onPop = () => {
      const next = parseLocation()
      skipNextSync.current = true
      setNotFound(!isKnownPath(window.location.pathname))
      setMode(next.mode)
      setConversion(next.conversion)
      setCompressSel(next.compressSel)
      setMergeSel(next.mergeSel)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Convert menu: items are target-oriented ({ target }) or from→to pairs.
  const handleSelectConvert = (item) => {
    const next = convertItemToConversion(item)
    if (next?.from && next?.to) {
      setConversion(next)
      setMode('convert')
    }
  }
  // The target selector changes the output format (and, for media, may update
  // the previewed source when a file is dropped).
  const handleChangeTarget = (nextTo, nextFrom) => {
    setConversion((c) => ({ from: nextFrom ?? c.from, to: nextTo }))
  }
  // Auto-detect updates the previewed source as files are dropped.
  const handleChangeConversion = (next) => {
    if (next?.from && next?.to) setConversion(next)
  }

  // Compress menu.
  const handleSelectCompress = (item) => {
    if (item?.format) {
      setCompressSel({ format: item.format })
      setMode('compress')
    }
  }
  // In-workspace switch of what we're compressing (no nav menu needed).
  const handleChangeCompress = (nextFormat) => {
    if (nextFormat) setCompressSel({ format: nextFormat })
  }

  // Merge menu.
  const handleSelectMerge = (item) => {
    if (item?.op) {
      setMergeSel({ op: item.op, label: item.label })
      setMode('merge')
    }
  }

  // Logo → home: reset to the default landing view and push a clean URL entry so
  // Back returns here. (SPA reset, no full reload.)
  const handleGoHome = () => {
    const home = parseLocation('') // no params → all defaults
    skipNextSync.current = true
    setNotFound(false)
    setMode(home.mode)
    setConversion(home.conversion)
    setCompressSel(home.compressSel)
    setMergeSel(home.mergeSel)
    window.history.pushState(null, '', '/')
  }

  return (
    <AppLayout
      // On a 404 no tool is active, so no nav tab is highlighted.
      mode={notFound ? null : mode}
      onSelectConvert={handleSelectConvert}
      onSelectCompress={handleSelectCompress}
      onSelectMerge={handleSelectMerge}
      onGoHome={handleGoHome}
    >
      {notFound ? (
        <NotFoundPage onGoHome={handleGoHome} />
      ) : (
        <HomePage
          mode={mode}
          conversion={conversion}
          compressSel={compressSel}
          mergeSel={mergeSel}
          onChangeTarget={handleChangeTarget}
          onChangeConversion={handleChangeConversion}
          onChangeCompress={handleChangeCompress}
        />
      )}
    </AppLayout>
  )
}
