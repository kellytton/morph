import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { HomePage } from './pages/HomePage'
import {
  DEFAULT_CONVERSION,
  DEFAULT_COMPRESS,
  DEFAULT_MERGE,
  convertItemToConversion,
} from './config/conversions'

export default function App() {
  // The active tool mode and its per-mode selection.
  const [mode, setMode] = useState('convert')
  // Convert is target-oriented: `to` is the real choice; `from` is only a
  // preview seed (each file's real source is auto-detected on upload).
  const [conversion, setConversion] = useState(DEFAULT_CONVERSION)
  const [compressSel, setCompressSel] = useState(DEFAULT_COMPRESS)
  const [mergeSel, setMergeSel] = useState(DEFAULT_MERGE)

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

  return (
    <AppLayout
      mode={mode}
      onSelectConvert={handleSelectConvert}
      onSelectCompress={handleSelectCompress}
      onSelectMerge={handleSelectMerge}
    >
      <HomePage
        mode={mode}
        conversion={conversion}
        compressSel={compressSel}
        mergeSel={mergeSel}
        onChangeTarget={handleChangeTarget}
        onChangeConversion={handleChangeConversion}
        onChangeCompress={handleChangeCompress}
      />
    </AppLayout>
  )
}
