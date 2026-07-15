import { ConvertWorkspace } from '../components/workspaces/ConvertWorkspace'
import { MediaConvertWorkspace } from '../components/workspaces/MediaConvertWorkspace'
import { DocumentConvertWorkspace } from '../components/workspaces/DocumentConvertWorkspace'
import { CompressWorkspace } from '../components/workspaces/CompressWorkspace'
import { MergeWorkspace } from '../components/workspaces/MergeWorkspace'
import { isMediaFormat } from '../converters/registry'

/**
 * Routes to the active tool workspace based on `mode`. Convert further splits
 * by conversion family: PDF↔images → document workspace; video/audio → media
 * (ffmpeg) workspace; otherwise the canvas image workspace.
 */
export function HomePage({
  mode,
  conversion,
  compressSel,
  mergeSel,
  onChangeTarget,
  onChangeConversion,
}) {
  if (mode === 'compress') {
    return <CompressWorkspace selection={compressSel} />
  }
  if (mode === 'merge') {
    return <MergeWorkspace selection={mergeSel} />
  }
  // Documents: any conversion involving PDF.
  if (conversion.from === 'pdf' || conversion.to === 'pdf') {
    return <DocumentConvertWorkspace conversion={conversion} onChangeTarget={onChangeTarget} />
  }
  if (isMediaFormat(conversion.to)) {
    return <MediaConvertWorkspace conversion={conversion} onChangeTarget={onChangeTarget} />
  }
  return (
    <ConvertWorkspace
      conversion={conversion}
      onChangeTarget={onChangeTarget}
      onChangeConversion={onChangeConversion}
    />
  )
}

export default HomePage
