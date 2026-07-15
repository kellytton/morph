// Hand-rolled encoders for formats the canvas can't reliably produce via
// toBlob (BMP, ICO). Both are simple uncompressed formats, so we build the
// bytes directly from canvas pixel data. This makes them work in every
// browser rather than depending on spotty native encode support.

/**
 * Encode RGBA pixel data (from ctx.getImageData) as a 32-bit BMP Blob.
 * BMP stores rows bottom-up and pixels as BGRA.
 */
export function encodeBMP(imageData) {
  const { width, height, data } = imageData
  const rowSize = width * 4
  const pixelArraySize = rowSize * height
  const fileHeaderSize = 14
  const dibHeaderSize = 40
  const offset = fileHeaderSize + dibHeaderSize
  const fileSize = offset + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  // BITMAPFILEHEADER
  view.setUint8(0, 0x42) // 'B'
  view.setUint8(1, 0x4d) // 'M'
  view.setUint32(2, fileSize, true)
  view.setUint32(10, offset, true)

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, dibHeaderSize, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true) // positive = bottom-up
  view.setUint16(26, 1, true) // planes
  view.setUint16(28, 32, true) // bits per pixel
  view.setUint32(30, 0, true) // BI_RGB, no compression
  view.setUint32(34, pixelArraySize, true)

  // Pixel array, bottom row first, BGRA order.
  let p = offset
  for (let y = height - 1; y >= 0; y--) {
    let src = y * rowSize
    for (let x = 0; x < width; x++) {
      const r = data[src++]
      const g = data[src++]
      const b = data[src++]
      const a = data[src++]
      view.setUint8(p++, b)
      view.setUint8(p++, g)
      view.setUint8(p++, r)
      view.setUint8(p++, a)
    }
  }

  return new Blob([buffer], { type: 'image/bmp' })
}

/**
 * Encode a PNG Blob into an ICO container. ICO simply wraps one or more images
 * (we embed a single PNG, which modern ICO readers accept). `pngBuffer` is an
 * ArrayBuffer of PNG bytes; width/height must each be ≤ 256.
 */
export function encodeICO(pngBuffer, width, height) {
  const png = new Uint8Array(pngBuffer)
  const headerSize = 6
  const dirEntrySize = 16
  const offset = headerSize + dirEntrySize
  const total = offset + png.length

  const buffer = new ArrayBuffer(total)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // ICONDIR
  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type: 1 = icon
  view.setUint16(4, 1, true) // image count

  // ICONDIRENTRY
  view.setUint8(6, width >= 256 ? 0 : width) // 0 means 256
  view.setUint8(7, height >= 256 ? 0 : height)
  view.setUint8(8, 0) // palette
  view.setUint8(9, 0) // reserved
  view.setUint16(10, 1, true) // color planes
  view.setUint16(12, 32, true) // bits per pixel
  view.setUint32(14, png.length, true) // image data size
  view.setUint32(18, offset, true) // offset to image data

  bytes.set(png, offset)
  return new Blob([buffer], { type: 'image/x-icon' })
}
