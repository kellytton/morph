<div align="center">

# ✨ Morph · File Conversion, Beautifully

### Convert, compress, and merge your files right in the browser — images, PDFs, audio, and video. Fast, private, and free.

[![Live Demo](https://img.shields.io/badge/live-demo-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://usemorph.netlify.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Material UI](https://img.shields.io/badge/MUI-9-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![License](https://img.shields.io/badge/license-MIT-C08552?style=for-the-badge)](#-license)

<br />

**[🌐 Try Morph](https://usemorph.netlify.app/) · [💼 LinkedIn](https://www.linkedin.com/in/kellytton/) · [🐙 GitHub](https://github.com/kellytton)**

</div>

---

## ✨ About

**Morph** is a browser-based file toolkit for converting, compressing, organizing images, PDFs, audio and video without ever uploading your files. Every operation runs locally using WebAssembly, FFmpeg.wasm, and browser APIs, keeping your data private while eliminating upload limits.

Beyond file conversion, Morph includes PDF editing tools, batch processing, live previews, compression analytics, and responsive interactions.

As someone who enjoys both software engineering and UI/UX design, I wanted Morph to feel as polished as it is practical. Every interaction was intentionally crafted to make everyday file management more enjoyable.

Thanks for stopping by. I hope Morph makes your file wrangling a little easier!

---

## 📸 Showcase

<div align="center">

<img src="public/assets/readme/readme-1.webp" alt="Morph screenshot 1" width="85%" />

<img src="public/assets/readme/readme-2.webp" alt="Morph screenshot 2" width="85%" />

<img src="public/assets/readme/readme-3.webp" alt="Morph screenshot 3" width="85%" />

<img src="public/assets/readme/readme-4.webp" alt="Morph screenshot 4" width="85%" />

</div>

---

## 🏗️ Architecture

Morph is a **single-page app with zero backend** — there's no server, database, or API. Every file operation happens client-side in a worker or on the main thread, so files never leave the browser.

```mermaid
flowchart TD
    A["📥 Drop / pick a file<br/><i>UploadZone</i>"] --> B["🔍 Detect format<br/><i>detectFormat.js — MIME + extension</i>"]
    B --> C{"⚙️ Converter Registry<br/><i>registry.js — routes each from → to pair</i>"}

    C -->|images| D["🖼️ Canvas API<br/><i>imageConverters.js<br/>rasterEncoders.js</i>"]
    C -->|PDFs| E["📄 pdf-lib + pdf.js<br/><i>pdfConverters.js</i>"]
    C -->|audio / video| F["🎬 FFmpeg.wasm<br/><i>ffmpegEngine.js<br/>mediaConverters.js</i>"]

    D --> G["📋 Conversion Queue<br/><i>useConversionQueue.js — sequential runs,<br/>live progress, cancel / retry</i>"]
    E --> G
    F --> G

    G --> H["⬇️ Download<br/><i>blob, or batch ZIP via fflate</i>"]
```

**Key design decisions**

- **Data-driven UI** — the whole navigation and every conversion is described by config (`config/conversions.js`); adding a converter is a data change, not a component change.
- **Pluggable engine registry** — `converters/registry.js` maps each `from → to` pair to an engine, with runtime capability detection (`encodeSupport.js`) so unsupported formats are hidden rather than dead-ending.
- **Lazy, heavy assets** — the ~31 MB FFmpeg core loads only on the first media conversion, then is cached for the session.
- **URL-as-state routing** — no router library; the active tool and selection live in query params (`config/routing.js`), giving shareable links, working Back/Forward, and per-route SEO.
- **Cross-origin isolation** — `COOP`/`COEP` headers (set in `vite.config.js` + `netlify.toml`) enable `SharedArrayBuffer` for FFmpeg.

**Project structure**

```
src/
├── components/
│   ├── workspaces/   # per-tool UIs (convert, compress, merge, split, edit)
│   ├── queue/        # conversion queue, item rows, stats, lightbox
│   ├── conversion/   # format chips, pickers, quality/resize controls
│   ├── layout/       # header, nav, footer, app frame
│   ├── decor/        # animated stars, bursts, moons
│   └── common/       # sticker buttons, toggles
├── converters/       # the engines: image, pdf, media, + the registry
├── config/           # conversions (menu data) + URL routing
├── hooks/            # queue, FLIP reorder, localStorage
├── theme/            # MUI theme, sticker design tokens, palette
└── pages/            # HomePage router + 404
```

---

## 🌟 Features

- 🔒 **100% in-browser & private** — every conversion runs locally via WebAssembly + Canvas; your files never touch a server
- 🖼️ **Image conversion** — PNG, JPG, WebP, AVIF, BMP, ICO, with browser-capability detection (formats you can't encode are hidden, never a dead-end)
- 📄 **PDF toolkit** — PDF ↔ images, plus **merge, split, and a visual page editor** (reorder, rotate, delete) with live page thumbnails and a scissor-style split UI
- 🎬 **Audio & video** — transcode MP4, WebM, GIF, MP3, WAV, OGG via a lazy-loaded **FFmpeg.wasm** engine (cached after first use)
- 🗜️ **Smart compression** — quality control for lossy formats, resize control for lossless ones, with a "never make it bigger" guard
- ♿ **Accessible (WCAG 2.1 AA)** — semantic landmarks, skip link, live-region announcements, full keyboard support, and `prefers-reduced-motion` throughout
- 🔍 **SEO-ready** — per-route titles, Open Graph / Twitter cards, JSON-LD structured data, sitemap, and a branded 404
- 📱 **Fully responsive** — a sticky glass navbar, adaptive queue layout, and polish across desktop, tablet, and mobile
- 🎨 **Sticker-inspired design system** — hand-built pastel components, springy micro-interactions, and a starry animated backdrop

---

## 🛠️ Tech Stack

| Category         | Technologies                                                                                                                                                                                                                                                                                                |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**    | ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black) ![React Compiler](https://img.shields.io/badge/React_Compiler-1.0-61DAFB?logo=react&logoColor=black)                                                                                                                      |
| **Build Tool**   | ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)                                                                                                                                                                                                                               |
| **UI & Styling** | ![Material UI](https://img.shields.io/badge/MUI-9-007FFF?logo=mui&logoColor=white) ![Emotion](https://img.shields.io/badge/Emotion-11-DB7093?logo=styledcomponents&logoColor=white)                                                                                                                         |
| **File Engines** | ![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg.wasm-007808?logo=ffmpeg&logoColor=white) ![pdf-lib](https://img.shields.io/badge/pdf--lib-F40F02) ![pdf.js](https://img.shields.io/badge/pdf.js-E34F26) ![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?logo=webassembly&logoColor=white) |
| **Language**     | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)                                                                                                                                |
| **Tooling**      | ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white) ![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)                                                             |

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/kellytton/morph.git
cd morph

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

> **Note:** Media (audio/video) conversion uses FFmpeg.wasm, which requires cross-origin isolation (`COOP`/`COEP` headers). These are set for local dev/preview in `vite.config.js` and for production in `netlify.toml`.

### Available Scripts

| Command           | Description                          |
| :---------------- | :----------------------------------- |
| `npm run dev`     | Start the local development server   |
| `npm run build`   | Build for production                 |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint across the project        |

---

## 📫 Get in Touch

<div align="center">

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kellytton/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kellytton)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:kthton@gmail.com)

</div>

---

## 📄 License

© 2026 Kelly Ton. All rights reserved.

<div align="center">

<br />

**Designed & built with 💕 by [Kelly Ton](https://github.com/kellytton)**

</div>
