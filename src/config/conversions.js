// Central registry describing every conversion Morph offers.
// The UI (mega-menu, format pair, cards) is driven entirely by this data,
// so adding a new converter is a data change, not a component change.
//
// `sticker` maps to a swatch key in theme.morph.stickers, giving each
// format a consistent pastel identity across the app.

// Per-format visual + descriptive metadata, keyed by lowercase id.
// `description` is a short, friendly one-liner explaining the format,
// shown in the detail cards under the conversion pair.
export const FORMATS = {
  png: {
    id: "png",
    label: "png",
    sticker: "blue",
    kind: "image",
    name: "Portable Network Graphics",
    description:
      "Lossless image format with crisp edges and full transparency. Great for logos, icons, and screenshots — larger files, perfect quality.",
  },
  jpg: {
    id: "jpg",
    label: "jpg",
    sticker: "lemon",
    kind: "image",
    name: "JPEG Image",
    description:
      "The classic photo format. Small files with smooth gradients, but no transparency and some quality loss when compressed.",
  },
  webp: {
    id: "webp",
    label: "webp",
    sticker: "pink",
    kind: "image",
    name: "WebP Image",
    description:
      "Modern web format from Google. Up to 30% smaller than PNG or JPG at the same quality, with transparency support built in.",
  },
  avif: {
    id: "avif",
    label: "avif",
    sticker: "lilac",
    kind: "image",
    name: "AV1 Image File",
    description:
      "Next-gen format with the best compression available today. Tiny files, rich color, and transparency — ideal for fast-loading sites.",
  },
  svg: {
    id: "svg",
    label: "svg",
    sticker: "mint",
    kind: "image",
    name: "Scalable Vector Graphics",
    description:
      "Vector format built from math, not pixels. Scales to any size without blur — perfect for logos and icons.",
  },
  gif: {
    id: "gif",
    label: "gif",
    sticker: "peach",
    kind: "image",
    name: "Graphics Interchange Format",
    description:
      "The animation classic. Supports short looping clips in up to 256 colors — best for simple, fun motion.",
  },
  bmp: {
    id: "bmp",
    label: "bmp",
    sticker: "mint",
    kind: "image",
    name: "Bitmap Image",
    description:
      "Uncompressed raster format storing every pixel exactly. Universally readable, but files are large.",
  },
  ico: {
    id: "ico",
    label: "ico",
    sticker: "lemon",
    kind: "image",
    name: "Icon File",
    description:
      "The classic favicon format for websites and app icons. Bundles a small square image (up to 256×256).",
  },
  pdf: {
    id: "pdf",
    label: "pdf",
    sticker: "peach",
    kind: "document",
    name: "Portable Document Format",
    description:
      "Universal document format that looks identical everywhere. Ideal for sharing, printing, and archiving.",
  },
  mp4: {
    id: "mp4",
    label: "mp4",
    sticker: "lilac",
    kind: "media",
    name: "MPEG-4 Video",
    description:
      "The most widely supported video format. Great quality at small sizes and plays on virtually any device.",
  },
  mov: {
    id: "mov",
    label: "mov",
    sticker: "blue",
    kind: "media",
    name: "QuickTime Movie",
    description:
      "Apple's high-quality video format. Common from iPhones and Macs — convert to MP4 for wider compatibility.",
  },
  mp3: {
    id: "mp3",
    label: "mp3",
    sticker: "pink",
    kind: "media",
    name: "MP3 Audio",
    description:
      "The universal audio format. Small files that play everywhere, with a tiny trade-off in fidelity.",
  },
  wav: {
    id: "wav",
    label: "wav",
    sticker: "lemon",
    kind: "media",
    name: "Waveform Audio",
    description:
      "Uncompressed, studio-quality audio. Perfect fidelity in exchange for much larger files.",
  },
  webm: {
    id: "webm",
    label: "webm",
    sticker: "mint",
    kind: "media",
    name: "WebM Video",
    description:
      "Open, royalty-free video format built for the web. Small files with great quality in modern browsers.",
  },
  mkv: {
    id: "mkv",
    label: "mkv",
    sticker: "blue",
    kind: "media",
    name: "Matroska Video",
    description:
      "Flexible container that holds video, audio, and subtitles together. Convert to MP4 for wider support.",
  },
  ogg: {
    id: "ogg",
    label: "ogg",
    sticker: "peach",
    kind: "media",
    name: "Ogg Vorbis Audio",
    description:
      "Open, royalty-free audio format. Good quality at small sizes — a free alternative to MP3.",
  },
  m4a: {
    id: "m4a",
    label: "m4a",
    sticker: "lilac",
    kind: "media",
    name: "MPEG-4 Audio",
    description:
      "Apple's AAC audio format. Better quality than MP3 at the same size; common in iTunes and podcasts.",
  },
  flac: {
    id: "flac",
    label: "flac",
    sticker: "mint",
    kind: "media",
    name: "FLAC Audio",
    description:
      "Lossless compressed audio — CD-quality with no fidelity loss, at about half the size of WAV.",
  },
  zip: {
    id: "zip",
    label: "zip",
    sticker: "lemon",
    kind: "other",
    name: "ZIP Archive",
    description:
      "Compressed archive bundling many files into one. Extract it to get all your files back.",
  },
};

/**
 * Menu structure for the "convert" mega-menu.
 *
 * Images are TARGET-oriented: the user picks what to convert TO ("To WebP"),
 * and the source is auto-detected from the dropped file. This avoids the
 * combinatorial explosion of listing every from→to pair, and matches how
 * people actually think ("I need a WebP"). Documents/media remain from→to
 * pairs shown as coming-soon until those engines land.
 */
export const CONVERSION_MENU = [
  {
    id: "images",
    label: "images",
    items: [
      { target: "webp" },
      { target: "png" },
      { target: "jpg" },
      { target: "avif" },
      { target: "bmp" },
      { target: "ico" },
    ],
  },
  {
    id: "documents",
    label: "documents",
    items: [
      // Working, client-side (pdf.js + pdf-lib). `doc: true` routes these to
      // the document workspace; `label` overrides the default "To X" text.
      { doc: true, from: "pdf", target: "png", label: "PDF → PNG" },
      { doc: true, from: "pdf", target: "jpg", label: "PDF → JPG" },
      { doc: true, from: "png", target: "pdf", label: "Images → PDF" },
    ],
  },
  {
    id: "media",
    label: "media",
    items: [
      { target: "mp4" },
      { target: "webm" },
      { target: "gif" },
      { target: "mp3" },
      { target: "wav" },
      { target: "ogg" },
    ],
  },
];

// A sensible default source for each target, used before a file is dropped so
// the format-pair bar shows a meaningful from→to preview. Image targets have
// real defaults; doc/media targets point at a representative common source.
export const DEFAULT_SOURCE_FOR_TARGET = {
  webp: "png",
  png: "webp",
  jpg: "png",
  avif: "png",
  bmp: "png",
  ico: "png",
  mp4: "mov",
  webm: "mp4",
  gif: "mp4",
  mp3: "wav",
  wav: "mp3",
  ogg: "mp3",
  m4a: "mp3",
};

/** The conversion shown by default on the landing screen. */
export const DEFAULT_CONVERSION = { from: "png", to: "webp" };

/**
 * Menu structure for the "compress" mega-menu. Each item shrinks a file while
 * keeping its format. `format` is the input/output format id. Image formats
 * are functional; documents/media are placeholders for now.
 */
export const COMPRESS_MENU = [
  {
    id: "images",
    label: "images",
    items: [
      { format: "png", label: "Compress PNG" },
      { format: "jpg", label: "Compress JPG" },
      { format: "webp", label: "Compress WebP" },
      { format: "avif", label: "Compress AVIF" },
    ],
  },
  {
    id: "documents",
    label: "documents",
    items: [{ format: "pdf", label: "Compress PDF" }],
  },
  {
    id: "media",
    label: "media",
    items: [
      { format: "mp4", label: "Compress MP4" },
      { format: "mp3", label: "Compress MP3" },
    ],
  },
];

/**
 * Menu structure for the "merge" mega-menu — combining/reordering files.
 * `op` identifies the merge operation the workspace should perform.
 */
export const MERGE_MENU = [
  {
    id: "pdf",
    label: "pdf",
    items: [
      { op: "merge-pdf", label: "Merge PDFs" },
      { op: "split-pdf", label: "Split PDF" },
      { op: "reorder-pdf", label: "Edit PDF pages" },
    ],
  },
];

/** The default selection for each mode. */
export const DEFAULT_COMPRESS = { format: "png" };
export const DEFAULT_MERGE = { op: "merge-pdf" };

/** Simple nav sections in the header. */
export const NAV_SECTIONS = ["convert", "merge", "compress"];

/** Resolve a format id to its metadata, tolerating unknown ids. */
export function getFormat(id) {
  return (
    FORMATS[id] ?? {
      id,
      label: id,
      sticker: "blue",
      kind: "image",
      name: String(id ?? "").toUpperCase(),
      description: "",
    }
  );
}

/** Human label for a conversion pair, e.g. "PNG → WebP". */
export function conversionLabel({ from, to, label }) {
  if (label) return label;
  return `${from?.toUpperCase() ?? ""} → ${to?.toUpperCase() ?? ""}`;
}

/**
 * Label for a convert-menu item. Target items read "To WebP"; from→to pairs
 * (documents/media) keep the "PDF → JPG" form.
 */
export function convertItemLabel(item) {
  if (item.label) return item.label;
  if (item.target) return `To ${getFormat(item.target).label.toUpperCase()}`;
  return conversionLabel(item);
}

/** The sticker swatch key to show beside a convert-menu item. */
export function convertItemSticker(item) {
  return getFormat(item.target ?? item.to ?? item.from).sticker;
}

/**
 * Resolve a convert-menu item into a { from, to } conversion. For plain target
 * items, the source defaults sensibly (overridden later by the dropped file).
 * Document items carry an explicit `from` + `target`.
 */
export function convertItemToConversion(item) {
  if (item.doc) {
    return { from: item.from, to: item.target };
  }
  if (item.target) {
    return {
      from: DEFAULT_SOURCE_FOR_TARGET[item.target] ?? "png",
      to: item.target,
    };
  }
  return { from: item.from, to: item.to };
}
