# DevPad — IDEA

> Extracted from `../project-ideas/01-clientside-tools.md` (cluster 01) and
> `../project-ideas/SUMMARY.md`. Part of the **"Zero-cost client-side browser tools"** cluster.

---

## Cluster context (applies to all client-side tools)

**Primary angle:** publicly hosted, near-zero-cost utilities where *all compute happens in the
browser*. **Secondary angles touched:** AI/LLM-native (on-device), DevX, privacy-by-design.

### Shared foundation (read once, applies to every tool below)

- **Hosting:** static export on **Vercel or Netlify** (or Cloudflare Pages, which you already use).
  The server only ships HTML/JS/WASM — there is **no backend, no per-request cost, no LLM API
  bill**. Free tier covers it essentially forever; cost ≈ €0 + a domain.
- **Compute:** runs on the *visitor's* CPU/GPU via **WebAssembly, Canvas/OffscreenCanvas, the Web
  Audio API, Web Workers, and (where available) WebGPU**. This is the whole reason the economics
  work — you scale to any traffic without scaling cost.
- **Privacy-by-design:** files never leave the device. This is both a *feature* (the marketing
  hook — "your files never get uploaded") and a **GDPR talking point** for German/EU employers.
- **Why this cluster matters for you:** it's the fastest path to *live, linkable, on-portfolio*
  proof. Each tool is a self-contained repo + a public URL you can put on the CV. Recruiters can
  click and use it in 5 seconds — far stronger than a screenshot.

**Stack home for Rust:** the compute-heavy core of one tool (image tiling/scaling in PosterForge,
or PDF rasterization) is written in **Rust compiled to WASM** (`wasm-pack` / `wasm-bindgen`). That
gives you a genuine, demoable Rust+WASM artifact — a strong, scarce keyword — without committing a
whole product to a language you're still learning.

---

## Project: DevPad *(JSON / Markdown developer tools · web + macOS app · deep · primary)*

### 1. One-liner & angle
A fast, offline **developer scratchpad** that runs as **both a website and a native macOS app**
(one shared codebase): JSON ⇄ YAML ⇄ CSV conversion, JSON Schema validation, JSONPath querying,
JSON diff/tree-view, **plus** a Markdown editor with live preview and **Markdown → polished PDF**
export. It **opens `.md`/`.json` files** and offers a **one-key toggle between edit and view that
preserves your scroll position**. Angle: zero-cost client-side tool that signals **DevX** *and*
**native-app** range.

### 2. Problem / who has it
Developers reach for online JSON formatters/validators and Markdown editors dozens of times a week
— and routinely paste **company data into random websites** of unknown trustworthiness. They also
open `.md`/`.json` in a heavy IDE just to *read* them, and **lose their place every time they flip
between raw text and rendered view**. A single, fast, *local-only* tool that does the common 80%,
opens files natively, and toggles edit↔view **in place (keeping scroll)** removes the risk, the
tab-juggling, and the daily annoyance.

### 3. Market value
- Developer utilities get **enormous organic search + GitHub traffic** (every "json formatter"
  search is a potential visitor); they're cheap to run and great backlinks to your portfolio.
- A **downloadable Mac app** that registers as a `.md`/`.json` handler earns repeat daily use
  (dock/Spotlight) and a second distribution surface — far stickier than a one-off web visit.
- **Monetization:** mostly a reputation/traffic asset; optional Pro (large-file mode, saved
  snippets, custom schemas, the desktop build). Hosting ≈ €0.

### 4. Why it makes you hirable (DE / EU / MESA)
- It's a tool *developers* use → your audience includes the people who hire. High word-of-mouth.
- Shows you sweat **DevX, correctness, and keyboard-first UX** — and the "don't paste data into
  sketchy sites" privacy framing again resonates in the EU.
- Shipping the *same* codebase as a **web app and a signed native `.app`** demonstrates
  cross-platform packaging (Tauri/Rust) — tangible, in-demand range few portfolios show.

### 5. Tech stack
- **Shared web core:** TypeScript; `monaco-editor` or CodeMirror 6; `ajv` (JSON Schema), `js-yaml`,
  a JSONPath lib; `marked` + `DOMPurify` for Markdown; `pdf-lib`/print-CSS for Markdown→PDF.
- **Desktop (`.app`):** **Tauri v2** (system WebView + small **Rust** shell) wraps the *same* UI
  into a signed `.app`/`.dmg`, adding native file dialogs, **file-type association for `.md`/`.json`**
  (double-click to open), drag-onto-dock, and **real read/write to the file on disk** — the web
  build is limited to the Chromium-only File System Access API (Safari/Firefox: upload + download
  only). *(Electron is the heavier, Chromium-bundled alternative; Tauri's Rust shell also dovetails
  with the Rust→WASM work in PosterForge.)*
- **Web build** can additionally ship as an installable **PWA** (offline) — cheap service-worker
  practice for Cluster 05.

### 6. Core features (MVP)
Format/validate JSON; JSON↔YAML↔CSV; JSONPath query; two-pane JSON diff; Markdown live preview +
export to PDF. **Open `.md`/`.json`** (double-click association, File ▸ Open, or drag-drop) and, in
the app, **save back to disk**. **One-key edit↔view toggle (⌘E / Ctrl+E)** that **preserves scroll
position** across modes — for Markdown via a source-line ↔ rendered-block map, for JSON via the
focused node/line. Non-goals v1: collaboration, cloud sync, accounts.

### 7. Architecture
```
        ┌──────────── shared web UI (TS + Monaco/CodeMirror) ─────────────┐
        │ editor ─▶ pure-TS transforms (ajv/js-yaml/jsonpath/marked) ─▶ view│
        │ edit⇄view toggle keeps scroll (source-line ↔ rendered-block map) │
        └──────────────────────────────────────────────────────────────────┘
   Web:    static host (Vercel/Netlify) · upload/download or File System Access API · €0
   macOS:  Tauri shell (Rust) ─▶ native open/save + .md/.json association ─▶ signed .app/.dmg
```

### 8. Scope & milestones
Weekend: JSON format/validate/convert (web). +Few days: diff, JSONPath, Markdown preview + PDF,
**edit↔view toggle with scroll-sync**. +~1 weekend: **Tauri shell** — native open/save, `.md`/`.json`
file association, package a signed `.app`/`.dmg`. The web build ships first; the Mac app is an
additive target. ~1–2 weekends web + ~1 weekend desktop.

### 9. Risks / saturation
Very crowded individually, but **bundled + private + fast + installable + native file handler** is a
real edge. SEO is the growth lever for the web build; pick a couple of niches (e.g. a JSON Schema
playground) to rank on.
**Build notes:** (1) the **scroll-preserving edit↔view toggle** is the fiddly part — keep a
line→rendered-block map (`data-source-line`) with a scroll-ratio fallback. (2) Distributing the
`.app` outside the App Store needs **Apple code-signing + notarization** (Apple Developer Program,
~$99/yr) or users hit Gatekeeper → ship a notarized `.dmg`. (3) **Tauri = a new Rust toolchain**,
but it's shared learning with PosterForge.

### 10. Showcase plan
Live URL **and** a downloadable notarized **`.dmg`**. GIFs: JSON→YAML; a Markdown doc exporting to a
clean PDF; and the standout — **double-clicking a `.md` file to open it in the app, then hitting ⌘E
to flip edit↔view with the scroll position held steady**. "Works offline" + "opens your files
natively" badges.

---

## From SUMMARY.md

| # | Idea | Cluster · angle | One-liner | Key stack | Tier | Effort | Cost | Isl | Host | Lib | Img |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | DevPad | 01 · client-side tool | JSON↔YAML↔CSV, validate, diff, Markdown→PDF; opens `.md`/`.json`; edit↔view toggle; **+ macOS app** | TS, Monaco, `ajv` (+ **Tauri**) | ⭐ | ~1–2 wk web (+~1 wk app) | €0 | ✅ | ✅ | 🟡 | — |

**Why it sells you:** DevX + huge SEO/long-tail traffic + a native Mac app from the same codebase.

**Packaging verdict** (Isl = React island · Host = Vercel/Netlify · Lib = npm/PyPI/Maven · Img = public Docker image):
- **React island — ✅:** embeddable as a self-contained, client-side component in the Astro portfolio (no backend).
- **Host on Vercel/Netlify — ✅:** fully static (optionally an installable PWA) — runs entirely there for ≈ €0.
- **Library — 🟡:** a reusable core could be published while the app stays separate — here, the **JSON↔YAML↔CSV / validation transforms**.
- **Docker image — —:** not meaningful (pure client-side/static).
- **Desktop `.app` — ✅ (beyond the four columns):** ships as a **signed macOS app via Tauri** (system WebView + Rust shell), with `.md`/`.json` file association and native open/save. Electron is the heavier alternative.

**Pick guidance:** the **best long-tail SEO / traffic asset** in the cluster — pick it if you want
steady portfolio visitors.
