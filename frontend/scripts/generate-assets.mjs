/**
 * Placeholder asset generator — GENTECHNE
 * --------------------------------------
 * Produces on-brand SVG mockups so every path in src/data/projects.js resolves
 * to a real file. Replace any generated file with a real screenshot or photo of
 * the same name and the site picks it up with no code change.
 *
 *   node scripts/generate-assets.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dirname, '..', 'public')

/* ── palette ─────────────────────────────────────────────── */
const C = {
  void: '#050507',
  carbon: '#0A0A0D',
  graphite: '#101014',
  ash: '#17171C',
  smoke: '#232329',
  steel: '#35353E',
  mist: '#6B6B78',
  silver: '#9C9CA8',
  bone: '#E6E6EA',
  brass: '#C6A87C',
  brassDim: '#8C7554',
  halo: '#9FB4C9',
  sage: '#A8C0A0',
  lilac: '#B0A8C8',
  rose: '#C8A0A0',
}

/* ── deterministic rng ───────────────────────────────────── */
const rng = (seed) => {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}
const hash = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/* ── svg primitives ──────────────────────────────────────── */
const rect = (x, y, w, h, fill, r = 0, opacity = 1) =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}"${
    opacity === 1 ? '' : ` opacity="${f(opacity)}"`
  }/>`

const circle = (cx, cy, r, fill, opacity = 1) =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${
    opacity === 1 ? '' : ` opacity="${f(opacity)}"`
  }/>`

const line = (x1, y1, x2, y2, stroke, w = 1, opacity = 1) =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${f(
    w,
  )}"${opacity === 1 ? '' : ` opacity="${f(opacity)}"`}/>`

const text = (x, y, str, { size = 12, fill = C.bone, weight = 500, anchor = 'start', family = 'Inter, system-ui, sans-serif', spacing = 0, opacity = 1 } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="${family}" font-size="${f(size)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${
    spacing ? ` letter-spacing="${f(spacing)}"` : ''
  }${opacity === 1 ? '' : ` opacity="${f(opacity)}"`}>${esc(str)}</text>`

const mono = (x, y, str, opts = {}) =>
  text(x, y, str, { family: 'JetBrains Mono, ui-monospace, monospace', size: 9, fill: C.mist, spacing: 1.2, ...opts })

const f = (n) => (Number.isInteger(n) ? n : Number(n.toFixed(2)))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Text-line placeholder bars (used where real copy would sit). */
const bars = (x, y, w, count, r, { gap = 9, h = 5, fill = C.steel, taper = true } = {}) => {
  let out = ''
  for (let i = 0; i < count; i++) {
    const ww = taper ? w * (0.55 + r() * 0.45) : w
    out += rect(x, y + i * gap, ww, h, fill, h / 2, 0.75 - i * 0.06)
  }
  return out
}

const wrap = (w, h, body, { bg = C.carbon, id = 'g' } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
<defs>
  <linearGradient id="${id}-bg" x1="0" y1="0" x2="0.6" y2="1">
    <stop offset="0%" stop-color="${C.graphite}"/><stop offset="100%" stop-color="${C.void}"/>
  </linearGradient>
  <radialGradient id="${id}-glow" cx="0.5" cy="0.28" r="0.75">
    <stop offset="0%" stop-color="${C.brass}" stop-opacity="0.16"/>
    <stop offset="100%" stop-color="${C.brass}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="${id}-img" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${C.steel}"/><stop offset="55%" stop-color="${C.smoke}"/><stop offset="100%" stop-color="${C.ash}"/>
  </linearGradient>
  <linearGradient id="${id}-brass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${C.brass}" stop-opacity="0.9"/><stop offset="100%" stop-color="${C.brassDim}" stop-opacity="0.35"/>
  </linearGradient>
</defs>
${rect(0, 0, w, h, bg)}
${rect(0, 0, w, h, `url(#${id}-bg)`)}
${rect(0, 0, w, h, `url(#${id}-glow)`)}
${body}
</svg>`

/* ══════════════════════════════════════════════════════════
   SCREEN GENERATORS
   ══════════════════════════════════════════════════════════ */

/** Phone app screen — 1170 × 2532 logical, drawn at 390 × 844. */
function phoneScreen({ seed, title, screen, accent = C.brass, index }) {
  const r = rng(seed)
  const W = 390
  const H = 844
  let s = ''

  // status bar
  s += mono(20, 30, '9:41', { size: 11, fill: C.bone, weight: 600 })
  s += rect(330, 22, 16, 9, C.silver, 2, 0.7)
  s += rect(310, 22, 12, 9, C.silver, 2, 0.5)
  s += rect(292, 22, 12, 9, C.silver, 2, 0.5)

  const layouts = ['feed', 'detail', 'chart', 'list', 'action']
  const layout = layouts[index % layouts.length]

  // header
  s += text(20, 84, title, { size: 27, weight: 700, fill: C.bone })
  s += mono(20, 104, screen.toUpperCase(), { size: 9, fill: accent })
  s += circle(358, 76, 16, C.ash)
  s += circle(358, 76, 15.4, C.smoke, 0.8)
  s += circle(358, 76, 6, accent, 0.85)

  if (layout === 'feed') {
    s += rect(20, 126, 350, 168, `url(#g-img)`, 18)
    s += rect(20, 126, 350, 168, accent, 18, 0.1)
    s += rect(36, 250, 96, 22, C.void, 11, 0.6)
    s += mono(48, 265, 'LIVE', { size: 9, fill: accent })
    s += circle(42, 261, 3, accent)
    for (let i = 0; i < 3; i++) {
      const y = 314 + i * 92
      s += rect(20, y, 350, 78, C.ash, 16)
      s += rect(20, y, 350, 78, C.smoke, 16, 0.35)
      s += rect(34, y + 15, 48, 48, `url(#g-img)`, 12)
      s += rect(96, y + 20, 150 + r() * 80, 7, C.silver, 3.5, 0.85)
      s += rect(96, y + 36, 120 + r() * 60, 5, C.steel, 2.5)
      s += rect(96, y + 50, 78, 5, C.steel, 2.5, 0.7)
      s += mono(340, y + 26, `0${i + 1}`, { size: 10, fill: accent, anchor: 'end' })
    }
  } else if (layout === 'detail') {
    s += rect(20, 126, 350, 300, `url(#g-img)`, 20)
    s += rect(20, 126, 350, 300, C.void, 20, 0.25)
    s += rect(20, 300, 350, 126, C.void, 20, 0.55)
    s += text(38, 356, 'Overview', { size: 20, weight: 600 })
    s += bars(38, 374, 300, 3, r, { gap: 13, h: 6 })
    for (let i = 0; i < 3; i++) {
      s += rect(20 + i * 118, 446, 106, 92, C.ash, 14)
      s += rect(20 + i * 118, 446, 106, 92, C.smoke, 14, 0.3)
      s += text(36 + i * 118, 492, `${Math.floor(12 + r() * 80)}`, { size: 26, weight: 700, fill: i === 0 ? accent : C.bone })
      s += mono(36 + i * 118, 512, ['TODAY', 'WEEK', 'TOTAL'][i], { size: 8 })
    }
    s += rect(20, 558, 350, 120, C.ash, 16)
    s += bars(38, 582, 300, 5, r, { gap: 18, h: 6, fill: C.steel })
  } else if (layout === 'chart') {
    s += rect(20, 126, 350, 220, C.ash, 18)
    s += rect(20, 126, 350, 220, C.smoke, 18, 0.3)
    // grid + line chart
    for (let i = 0; i < 4; i++) s += line(40, 170 + i * 44, 350, 170 + i * 44, C.steel, 1, 0.35)
    let path = ''
    const pts = 9
    for (let i = 0; i < pts; i++) {
      const x = 44 + (i * 300) / (pts - 1)
      const y = 320 - (0.2 + r() * 0.75) * 150
      path += `${i === 0 ? 'M' : 'L'}${f(x)} ${f(y)} `
    }
    s += `<path d="${path}" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    s += `<path d="${path}L344 330 L44 330 Z" fill="${accent}" opacity="0.1"/>`
    s += text(40, 158, 'Performance', { size: 13, weight: 600, fill: C.silver })
    for (let i = 0; i < 4; i++) {
      const y = 366 + i * 72
      s += rect(20, y, 350, 60, C.ash, 14)
      s += rect(34, y + 20, 20, 20, accent, 6, 0.2)
      s += rect(66, y + 22, 130 + r() * 60, 6, C.silver, 3, 0.8)
      s += rect(66, y + 38, 80, 5, C.steel, 2.5)
      s += text(350, y + 36, `${(r() * 9).toFixed(1)}k`, { size: 14, weight: 600, anchor: 'end', fill: C.bone })
    }
  } else if (layout === 'list') {
    s += rect(20, 126, 350, 44, C.ash, 22)
    s += circle(44, 148, 7, C.mist, 0.8)
    s += rect(60, 144, 130, 7, C.steel, 3.5)
    for (let i = 0; i < 7; i++) {
      const y = 188 + i * 84
      if (y > 760) break
      s += rect(20, y, 350, 70, i === 1 ? C.smoke : C.ash, 14)
      if (i === 1) s += rect(20, y, 3, 70, accent, 2)
      s += circle(50, y + 35, 15, `url(#g-img)`)
      s += rect(78, y + 22, 140 + r() * 80, 7, C.silver, 3.5, 0.9)
      s += rect(78, y + 40, 100 + r() * 50, 5, C.steel, 2.5)
      s += mono(352, y + 30, `${Math.floor(r() * 24)}h`, { size: 9, anchor: 'end' })
    }
  } else {
    s += rect(20, 150, 350, 350, C.ash, 24)
    s += rect(20, 150, 350, 350, C.smoke, 24, 0.28)
    s += circle(195, 300, 96, accent, 0.08)
    s += circle(195, 300, 72, accent, 0.12)
    s += `<circle cx="195" cy="300" r="86" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="${f(
      380 * (0.35 + r() * 0.5),
    )} 540" stroke-linecap="round" transform="rotate(-90 195 300)"/>`
    s += text(195, 308, `${Math.floor(38 + r() * 55)}%`, { size: 40, weight: 700, anchor: 'middle', fill: C.bone })
    s += mono(195, 332, 'COMPLETE', { size: 9, anchor: 'middle' })
    s += bars(50, 400, 290, 3, r, { gap: 16, h: 6 })
    s += rect(20, 540, 350, 56, accent, 28)
    s += text(195, 574, 'Continue', { size: 15, weight: 600, anchor: 'middle', fill: C.void })
    s += rect(20, 612, 350, 56, C.ash, 28)
    s += text(195, 646, 'Not now', { size: 15, weight: 500, anchor: 'middle', fill: C.silver })
  }

  // tab bar
  s += rect(0, 762, W, 82, C.void, 0, 0.94)
  s += line(0, 762, W, 762, C.smoke, 1)
  for (let i = 0; i < 4; i++) {
    const cx = 60 + i * 90
    s += rect(cx - 10, 790, 20, 20, i === 0 ? accent : C.steel, 6, i === 0 ? 0.95 : 0.7)
    s += rect(cx - 14, 818, 28, 4, i === 0 ? accent : C.steel, 2, i === 0 ? 0.6 : 0.4)
  }
  s += rect(135, 832, 120, 4, C.silver, 2, 0.5)

  return wrap(W, H, s, { bg: C.carbon })
}

/** Browser page — 1440 × 900 drawn at 1440 × 900. */
function webScreen({ seed, title, accent = C.brass, index }) {
  const r = rng(seed)
  const W = 1440
  const H = 900
  let s = ''
  const layout = index % 4

  // nav
  s += text(64, 56, title.toUpperCase(), { size: 15, weight: 700, spacing: 2.4 })
  const navItems = ['WORK', 'STUDIO', 'JOURNAL', 'CONTACT']
  navItems.forEach((n, i) => {
    s += mono(940 + i * 110, 56, n, { size: 10, fill: i === 0 ? C.bone : C.mist })
  })
  s += line(64, 84, W - 64, 84, C.smoke, 1, 0.7)

  if (layout === 0) {
    // editorial hero
    s += text(64, 260, 'BUILDING', { size: 128, weight: 800, fill: C.bone, spacing: -5 })
    s += text(64, 380, 'IN', { size: 128, weight: 800, fill: C.bone, spacing: -5 })
    s += text(210, 380, 'SILENCE.', { size: 128, weight: 800, fill: accent, spacing: -5 })
    s += bars(64, 430, 420, 3, r, { gap: 16, h: 7 })
    s += rect(64, 520, 190, 50, accent, 25)
    s += text(159, 551, 'View work', { size: 14, weight: 600, anchor: 'middle', fill: C.void })
    s += rect(820, 150, 556, 620, `url(#g-img)`, 8)
    s += rect(820, 150, 556, 620, C.void, 8, 0.2)
    s += mono(844, 750, 'FIG. 01 — SELECTED WORK', { size: 10, fill: C.silver })
  } else if (layout === 1) {
    // project grid
    s += text(64, 180, 'Selected work', { size: 44, weight: 600 })
    s += mono(W - 64, 180, '2019 — 2025', { size: 11, anchor: 'end' })
    for (let i = 0; i < 6; i++) {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 64 + col * 444
      const y = 240 + row * 330
      s += rect(x, y, 404, 240, `url(#g-img)`, 6)
      s += rect(x, y, 404, 240, i === 1 ? accent : C.void, 6, i === 1 ? 0.12 : 0.18)
      s += text(x, y + 274, ['Northwind', 'Obsidian', 'Form & Field', 'Ashgrove', 'Meridian', 'Signalyard'][i], {
        size: 17,
        weight: 600,
      })
      s += mono(x, y + 294, ['WEB', 'WEB / 3D', 'COMMERCE', 'SHOPIFY', 'APP', 'SAAS'][i], { size: 9 })
    }
  } else if (layout === 2) {
    // long-form / case study
    s += rect(64, 130, W - 128, 400, `url(#g-img)`, 8)
    s += rect(64, 130, W - 128, 400, C.void, 8, 0.25)
    s += text(64, 600, 'The brief', { size: 34, weight: 600 })
    s += bars(64, 640, 600, 5, r, { gap: 20, h: 7 })
    s += line(760, 600, 760, 800, C.smoke, 1)
    const meta = [
      ['CLIENT', 'Confidential'],
      ['YEAR', '2025'],
      ['SCOPE', 'Design, Build'],
      ['STACK', 'Next.js, GSAP'],
    ]
    meta.forEach(([k, v], i) => {
      s += mono(800, 620 + i * 46, k, { size: 9 })
      s += text(800, 640 + i * 46, v, { size: 14, weight: 500, fill: C.bone })
      s += line(800, 656 + i * 46, 1376, 656 + i * 46, C.smoke, 1, 0.6)
    })
  } else {
    // spatial catalogue
    s += mono(64, 140, 'CATALOGUE / SPATIAL INDEX', { size: 10, fill: accent })
    const cards = [
      [180, 220, 300, 380, 1],
      [520, 170, 360, 460, 1],
      [920, 230, 300, 380, 0.85],
      [80, 330, 180, 230, 0.55],
      [1240, 300, 160, 210, 0.5],
    ]
    cards.forEach(([x, y, w, h, o], i) => {
      s += rect(x, y, w, h, `url(#g-img)`, 6, o)
      s += rect(x, y, w, h, C.void, 6, (1 - o) * 0.5)
      if (i === 1) {
        s += rect(x, y + h - 70, w, 70, C.void, 0, 0.75)
        s += text(x + 24, y + h - 38, 'Arc Lounge Chair', { size: 16, weight: 600 })
        s += mono(x + 24, y + h - 18, '£2,400 — OAK / LINEN', { size: 9, fill: accent })
      }
    })
    s += text(64, 800, 'Move through the catalogue', { size: 22, weight: 500, fill: C.silver })
  }

  return wrap(W, H, s, { bg: C.void })
}

/** Storefront page. */
function storeScreen({ seed, title, accent = C.sage, index }) {
  const r = rng(seed)
  const W = 1440
  const H = 900
  let s = ''
  const layout = index % 4

  s += text(64, 54, title.toUpperCase(), { size: 14, weight: 700, spacing: 2.6 })
  ;['NEW IN', 'SHOP', 'ABOUT'].forEach((n, i) => (s += mono(300 + i * 110, 54, n, { size: 10 })))
  s += mono(1250, 54, 'SEARCH', { size: 10 })
  s += mono(1360, 54, 'CART (2)', { size: 10, fill: accent })
  s += line(64, 82, W - 64, 82, C.smoke, 1, 0.7)

  if (layout === 0) {
    s += rect(64, 118, W - 128, 420, `url(#g-img)`, 4)
    s += rect(64, 118, W - 128, 420, C.void, 4, 0.3)
    s += text(120, 320, 'BUILT TO', { size: 74, weight: 800, spacing: -3 })
    s += text(120, 396, 'OUTLAST.', { size: 74, weight: 800, spacing: -3, fill: accent })
    s += rect(120, 430, 170, 46, C.bone, 0)
    s += text(205, 459, 'Shop the range', { size: 13, weight: 600, anchor: 'middle', fill: C.void })
    for (let i = 0; i < 4; i++) {
      const x = 64 + i * 336
      s += rect(x, 588, 300, 230, `url(#g-img)`, 4)
      s += text(x, 856, ['Field Jacket', 'Canvas Trouser', 'Work Shirt', 'Cotton Tee'][i], { size: 14, weight: 500 })
      s += text(x + 300, 856, `£${[180, 120, 95, 45][i]}`, { size: 14, weight: 600, anchor: 'end', fill: accent })
    }
  } else if (layout === 1) {
    // collection grid + filters
    s += text(64, 150, 'All products', { size: 32, weight: 600 })
    s += mono(64, 178, '48 ITEMS', { size: 10 })
    ;['SIZE', 'COLOUR', 'FIT', 'PRICE'].forEach((fl, i) => {
      s += rect(300 + i * 120, 130, 104, 34, C.ash, 17)
      s += mono(352 + i * 120, 151, fl, { size: 9, anchor: 'middle' })
    })
    for (let i = 0; i < 8; i++) {
      const x = 64 + (i % 4) * 336
      const y = 220 + Math.floor(i / 4) * 340
      s += rect(x, y, 300, 250, `url(#g-img)`, 4)
      if (i === 2) {
        s += rect(x + 12, y + 12, 76, 24, accent, 12)
        s += mono(x + 50, y + 28, 'NEW', { size: 9, anchor: 'middle', fill: C.void })
      }
      s += text(x, y + 282, `Model ${String.fromCharCode(65 + i)}-0${i + 1}`, { size: 13, weight: 500 })
      s += text(x + 300, y + 282, `£${60 + i * 25}`, { size: 13, weight: 600, anchor: 'end', fill: C.silver })
    }
  } else if (layout === 2) {
    // product detail
    s += rect(64, 118, 640, 700, `url(#g-img)`, 4)
    for (let i = 0; i < 4; i++) s += rect(730, 118 + i * 96, 82, 82, `url(#g-img)`, 4, i === 0 ? 1 : 0.55)
    s += mono(860, 148, 'FIELD COLLECTION', { size: 10, fill: accent })
    s += text(860, 200, 'Waxed Field', { size: 42, weight: 600 })
    s += text(860, 246, 'Jacket', { size: 42, weight: 600 })
    s += text(860, 300, '£180.00', { size: 22, weight: 500, fill: accent })
    s += bars(860, 330, 460, 3, r, { gap: 16, h: 6 })
    s += mono(860, 410, 'SIZE', { size: 9 })
    ;['S', 'M', 'L', 'XL'].forEach((sz, i) => {
      s += rect(860 + i * 66, 424, 56, 44, i === 1 ? C.bone : C.ash, 2)
      s += text(888 + i * 66, 452, sz, { size: 13, weight: 500, anchor: 'middle', fill: i === 1 ? C.void : C.silver })
    })
    s += rect(860, 500, 460, 56, accent, 2)
    s += text(1090, 535, 'Add to cart', { size: 15, weight: 600, anchor: 'middle', fill: C.void })
    s += rect(860, 570, 460, 56, C.ash, 2)
    s += text(1090, 605, 'Add to wishlist', { size: 15, weight: 500, anchor: 'middle', fill: C.silver })
    ;['Free returns within 30 days', 'Ships in 1–2 working days', 'Lifetime repair programme'].forEach((t, i) => {
      s += circle(868, 668 + i * 34, 3, accent)
      s += text(886, 673 + i * 34, t, { size: 12, fill: C.silver })
    })
  } else {
    // checkout
    s += text(64, 150, 'Checkout', { size: 32, weight: 600 })
    ;['Contact', 'Delivery', 'Payment'].forEach((st, i) => {
      s += circle(80 + i * 200, 210, 13, i === 0 ? accent : C.ash)
      s += text(80 + i * 200, 215, String(i + 1), { size: 12, weight: 600, anchor: 'middle', fill: i === 0 ? C.void : C.mist })
      s += text(104 + i * 200, 215, st, { size: 13, fill: i === 0 ? C.bone : C.mist })
      if (i < 2) s += line(180 + i * 200, 210, 264 + i * 200, 210, C.smoke, 1)
    })
    ;['Email address', 'Full name', 'Address line 1', 'City', 'Postcode'].forEach((fl, i) => {
      const y = 270 + i * 78
      s += rect(64, y, 700, 58, C.ash, 3)
      s += rect(64, y, 700, 58, C.smoke, 3, 0.4)
      s += mono(84, y + 24, fl.toUpperCase(), { size: 8 })
      s += rect(84, y + 34, 180 + r() * 220, 6, C.silver, 3, 0.7)
    })
    s += rect(64, 686, 700, 58, accent, 3)
    s += text(414, 722, 'Pay £312.00', { size: 15, weight: 600, anchor: 'middle', fill: C.void })
    // summary
    s += rect(824, 270, 552, 400, C.ash, 4)
    s += rect(824, 270, 552, 400, C.smoke, 4, 0.35)
    for (let i = 0; i < 2; i++) {
      s += rect(852, 300 + i * 110, 84, 90, `url(#g-img)`, 4)
      s += text(956, 330 + i * 110, ['Waxed Field Jacket', 'Canvas Trouser'][i], { size: 13, weight: 500 })
      s += mono(956, 350 + i * 110, ['SIZE M / OLIVE', 'SIZE 32 / STONE'][i], { size: 9 })
      s += text(1348, 336 + i * 110, ['£180.00', '£132.00'][i], { size: 13, anchor: 'end', fill: C.silver })
    }
    s += line(852, 540, 1348, 540, C.smoke, 1)
    ;[['Subtotal', '£312.00'], ['Delivery', 'Free']].forEach(([k, v], i) => {
      s += text(852, 574 + i * 30, k, { size: 12, fill: C.mist })
      s += text(1348, 574 + i * 30, v, { size: 12, anchor: 'end', fill: C.silver })
    })
    s += text(852, 640, 'Total', { size: 16, weight: 600 })
    s += text(1348, 640, '£312.00', { size: 18, weight: 600, anchor: 'end', fill: accent })
  }

  return wrap(W, H, s, { bg: C.void })
}

/** CMS / editor screen. */
function cmsScreen({ seed, title, accent = C.lilac, index }) {
  const r = rng(seed)
  const W = 1440
  const H = 900
  let s = ''
  const layout = index % 4

  // chrome
  s += rect(0, 0, W, 52, C.graphite)
  s += line(0, 52, W, 52, C.smoke, 1)
  s += rect(24, 18, 16, 16, accent, 4, 0.8)
  s += text(52, 32, title, { size: 13, weight: 600 })
  s += mono(W - 130, 32, 'PUBLISHED', { size: 9, fill: C.sage })
  s += circle(W - 146, 28, 3, C.sage)

  if (layout === 3) {
    // rendered front end (the output)
    s += rect(0, 52, W, H - 52, C.void)
    s += text(64, 200, 'THE', { size: 96, weight: 800, spacing: -4 })
    s += text(64, 300, 'CHRONICLE', { size: 96, weight: 800, spacing: -4, fill: accent })
    s += line(64, 340, W - 64, 340, C.smoke, 1)
    for (let i = 0; i < 3; i++) {
      const x = 64 + i * 444
      s += rect(x, 380, 404, 230, `url(#g-img)`, 4)
      s += mono(x, 650, ['POLITICS', 'CULTURE', 'SCIENCE'][i], { size: 9, fill: accent })
      s += text(x, 686, ['The long road back', 'A quiet revolution', 'What the ice knows'][i], { size: 21, weight: 600 })
      s += bars(x, 706, 380, 3, r, { gap: 15, h: 5 })
    }
    return wrap(W, H, s, { bg: C.void })
  }

  // sidebar
  s += rect(0, 52, 220, H - 52, C.graphite)
  s += line(220, 52, 220, H, C.smoke, 1)
  ;['Posts', 'Pages', 'Blocks', 'Media', 'Users', 'Settings'].forEach((n, i) => {
    const active = i === (layout === 0 ? 0 : 2)
    if (active) s += rect(0, 88 + i * 48, 220, 40, accent, 0, 0.12)
    if (active) s += rect(0, 88 + i * 48, 3, 40, accent)
    s += rect(24, 102 + i * 48, 12, 12, active ? accent : C.steel, 3)
    s += text(50, 113 + i * 48, n, { size: 12.5, fill: active ? C.bone : C.mist, weight: active ? 600 : 400 })
  })

  // block inspector
  s += rect(W - 300, 52, 300, H - 52, C.graphite)
  s += line(W - 300, 52, W - 300, H, C.smoke, 1)
  s += mono(W - 276, 88, 'BLOCK SETTINGS', { size: 9, fill: accent })
  ;['Layout', 'Typography', 'Spacing', 'Colour', 'Advanced'].forEach((g, i) => {
    s += text(W - 276, 130 + i * 96, g, { size: 12, weight: 600, fill: C.silver })
    s += rect(W - 276, 142 + i * 96, 252, 40, C.ash, 4)
    s += rect(W - 264, 158 + i * 96, 100 + r() * 90, 6, C.steel, 3)
    s += rect(W - 276, 190 + i * 96, 120, 6, C.smoke, 3)
  })

  // canvas
  const cx = 252
  const cw = W - 300 - 252 - 32
  if (layout === 0) {
    s += mono(cx, 88, 'CONTENT BLOCKS', { size: 9 })
    const blocks = [
      ['HERO', 120],
      ['RICH TEXT', 96],
      ['IMAGE + CAPTION', 150],
      ['TWO COLUMN', 130],
      ['CTA', 84],
    ]
    let y = 104
    blocks.forEach(([name, h], i) => {
      s += rect(cx, y, cw, h, C.ash, 6)
      s += rect(cx, y, cw, h, i === 2 ? accent : C.smoke, 6, i === 2 ? 0.3 : 0.35)
      if (i === 2) s += `<rect x="${cx}" y="${y}" width="${cw}" height="${h}" rx="6" fill="none" stroke="${accent}" stroke-width="1.5"/>`
      s += mono(cx + 16, y + 22, name, { size: 9, fill: i === 2 ? accent : C.mist })
      s += rect(cx + 16, y + 34, cw * (0.4 + r() * 0.45), 7, C.steel, 3.5, 0.8)
      s += rect(cx + 16, y + 50, cw * 0.3, 5, C.steel, 2.5, 0.55)
      if (i === 2) {
        s += rect(cx + 16, y + 70, 160, 62, `url(#g-img)`, 4)
        // drag handles
        ;[[cx, y], [cx + cw, y], [cx, y + h], [cx + cw, y + h]].forEach(([hx, hy]) => {
          s += rect(hx - 4, hy - 4, 8, 8, accent, 2)
        })
      }
      y += h + 16
    })
  } else if (layout === 1) {
    // blocks separating / floating
    s += mono(cx, 88, 'LAYOUT ASSEMBLY', { size: 9, fill: accent })
    const float = [
      [cx + 30, 120, 380, 150, -3],
      [cx + 300, 260, 320, 130, 4],
      [cx + 60, 400, 420, 120, -2],
      [cx + 250, 560, 340, 150, 3],
      [cx + 20, 660, 240, 100, 5],
    ]
    float.forEach(([x, y, w, h, rot], i) => {
      s += `<g transform="rotate(${rot} ${f(x + w / 2)} ${f(y + h / 2)})">`
      s += rect(x, y, w, h, C.ash, 6)
      s += rect(x, y, w, h, C.smoke, 6, 0.4)
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="none" stroke="${accent}" stroke-width="1" opacity="0.5"/>`
      s += mono(x + 14, y + 20, ['HERO', 'TEXT', 'GALLERY', 'QUOTE', 'CTA'][i], { size: 8, fill: accent })
      s += rect(x + 14, y + 32, w * 0.6, 6, C.steel, 3)
      s += rect(x + 14, y + 46, w * 0.4, 5, C.steel, 2.5, 0.6)
      s += '</g>'
    })
  } else {
    // preview building itself
    s += mono(cx, 88, 'LIVE PREVIEW', { size: 9, fill: C.sage })
    s += rect(cx, 104, cw, H - 150, C.void, 6)
    s += rect(cx, 104, cw, H - 150, C.smoke, 6, 0.3)
    s += text(cx + 32, 190, 'The Chronicle', { size: 40, weight: 700 })
    s += line(cx + 32, 214, cx + cw - 32, 214, C.smoke, 1)
    s += rect(cx + 32, 240, cw - 64, 220, `url(#g-img)`, 4)
    s += text(cx + 32, 508, 'A quiet revolution in the north', { size: 24, weight: 600 })
    s += bars(cx + 32, 528, cw - 200, 6, r, { gap: 18, h: 6 })
    s += rect(cx + 32, 668, (cw - 96) / 2, 130, C.ash, 4)
    s += rect(cx + 64 + (cw - 96) / 2, 668, (cw - 96) / 2, 130, C.ash, 4)
  }

  return wrap(W, H, s, { bg: C.carbon })
}

/** SaaS dashboard. */
function dashScreen({ seed, title, accent = C.brass, index }) {
  const r = rng(seed)
  const W = 1440
  const H = 900
  let s = ''
  const layout = index % 5

  // sidebar
  s += rect(0, 0, 236, H, C.graphite)
  s += line(236, 0, 236, H, C.smoke, 1)
  s += rect(28, 28, 22, 22, accent, 6)
  s += text(60, 44, title, { size: 14, weight: 700 })
  ;['Overview', 'Fleet', 'Telemetry', 'Alerts', 'Reports', 'Billing', 'Settings'].forEach((n, i) => {
    const active = i === Math.min(layout, 4)
    if (active) {
      s += rect(16, 96 + i * 46, 204, 38, C.smoke, 8)
      s += rect(16, 102 + i * 46, 3, 26, accent, 2)
    }
    s += rect(36, 108 + i * 46, 13, 13, active ? accent : C.steel, 3)
    s += text(62, 119 + i * 46, n, { size: 12.5, fill: active ? C.bone : C.mist, weight: active ? 500 : 400 })
  })
  s += rect(16, H - 84, 204, 60, C.ash, 10)
  s += circle(46, H - 54, 15, `url(#g-img)`)
  s += rect(70, H - 62, 92, 6, C.steel, 3)
  s += rect(70, H - 48, 66, 5, C.steel, 2.5, 0.6)

  // topbar
  s += rect(236, 0, W - 236, 68, C.carbon)
  s += line(236, 68, W, 68, C.smoke, 1)
  s += text(268, 42, ['Overview', 'Fleet', 'Telemetry', 'Alerts', 'Reports'][Math.min(layout, 4)], { size: 19, weight: 600 })
  s += rect(W - 380, 20, 180, 30, C.ash, 15)
  s += mono(W - 362, 40, 'LAST 30 DAYS', { size: 9 })
  s += rect(W - 184, 20, 130, 30, accent, 15)
  s += text(W - 119, 40, 'Export', { size: 12, weight: 600, anchor: 'middle', fill: C.void })

  const X = 268
  const CW = W - 268 - 32

  if (layout === 0 || layout === 4) {
    // stat row
    const stats = [
      ['ACTIVE UNITS', '1,284', '+12.4%'],
      ['UPTIME', '99.97%', '+0.02%'],
      ['ALERTS', '7', '-38%'],
      ['THROUGHPUT', '482k', '+8.1%'],
    ]
    stats.forEach(([k, v, d], i) => {
      const x = X + i * ((CW + 20) / 4)
      s += rect(x, 100, (CW - 60) / 4, 118, C.ash, 10)
      s += rect(x, 100, (CW - 60) / 4, 118, C.smoke, 10, 0.35)
      s += mono(x + 20, 130, k, { size: 8.5 })
      s += text(x + 20, 176, v, { size: 32, weight: 700, fill: i === 0 ? accent : C.bone })
      s += text(x + 20, 198, d, { size: 11, fill: d.startsWith('-') ? C.rose : C.sage })
    })
    // main chart
    s += rect(X, 244, CW - 360, 320, C.ash, 10)
    s += rect(X, 244, CW - 360, 320, C.smoke, 10, 0.3)
    s += text(X + 24, 280, 'Throughput', { size: 15, weight: 600 })
    s += mono(X + CW - 384, 280, 'REALTIME', { size: 9, fill: C.sage, anchor: 'end' })
    const cw2 = CW - 360
    for (let i = 0; i < 5; i++) s += line(X + 24, 320 + i * 46, X + cw2 - 24, 320 + i * 46, C.steel, 1, 0.3)
    // bars
    const n = 22
    for (let i = 0; i < n; i++) {
      const bw = (cw2 - 60) / n - 6
      const bh = 30 + r() * 170
      s += rect(X + 30 + i * ((cw2 - 60) / n), 540 - bh, bw, bh, i > n - 4 ? accent : C.steel, 2, i > n - 4 ? 0.9 : 0.55)
    }
    // side panel
    s += rect(X + CW - 340, 244, 340, 320, C.ash, 10)
    s += rect(X + CW - 340, 244, 340, 320, C.smoke, 10, 0.3)
    s += text(X + CW - 316, 280, 'Recent alerts', { size: 14, weight: 600 })
    for (let i = 0; i < 4; i++) {
      const y = 306 + i * 60
      s += circle(X + CW - 310, y + 18, 4, [C.rose, accent, C.sage, C.mist][i])
      s += rect(X + CW - 294, y + 8, 180 + r() * 60, 6, C.silver, 3, 0.85)
      s += rect(X + CW - 294, y + 24, 130, 5, C.steel, 2.5, 0.6)
      s += mono(X + CW - 24, y + 18, `${Math.floor(r() * 59)}m`, { size: 9, anchor: 'end' })
    }
    // table
    s += rect(X, 592, CW, 276, C.ash, 10)
    s += rect(X, 592, CW, 276, C.smoke, 10, 0.3)
    ;['UNIT', 'REGION', 'STATUS', 'LATENCY', 'LAST SEEN'].forEach((h2, i) => {
      s += mono(X + 24 + i * (CW / 5), 626, h2, { size: 8.5 })
    })
    s += line(X + 24, 640, X + CW - 24, 640, C.smoke, 1)
    for (let i = 0; i < 5; i++) {
      const y = 674 + i * 40
      s += text(X + 24, y, `UNIT-${1000 + Math.floor(r() * 900)}`, { size: 12, fill: C.silver })
      s += text(X + 24 + CW / 5, y, ['EU-WEST', 'US-EAST', 'AP-SOUTH', 'EU-NORTH', 'US-WEST'][i], { size: 12, fill: C.mist })
      const ok = i !== 2
      s += rect(X + 24 + (2 * CW) / 5, y - 12, 64, 20, ok ? C.sage : C.rose, 10, 0.16)
      s += mono(X + 34 + (2 * CW) / 5, y + 2, ok ? 'ONLINE' : 'DEGRADED', { size: 8, fill: ok ? C.sage : C.rose })
      s += text(X + 24 + (3 * CW) / 5, y, `${Math.floor(8 + r() * 90)}ms`, { size: 12, fill: C.silver })
      s += text(X + 24 + (4 * CW) / 5, y, `${Math.floor(r() * 12)}s ago`, { size: 12, fill: C.mist })
      if (i < 4) s += line(X + 24, y + 14, X + CW - 24, y + 14, C.smoke, 1, 0.5)
    }
  } else if (layout === 1) {
    // map / fleet
    s += rect(X, 100, CW, 470, C.ash, 10)
    s += rect(X, 100, CW, 470, C.smoke, 10, 0.3)
    for (let i = 0; i < 26; i++) {
      const px = X + 40 + r() * (CW - 80)
      const py = 140 + r() * 390
      const big = r() > 0.85
      s += circle(px, py, big ? 7 : 3.2, big ? accent : C.halo, big ? 0.95 : 0.5)
      if (big) s += circle(px, py, 16, accent, 0.12)
    }
    for (let i = 0; i < 14; i++) {
      const x1 = X + 40 + r() * (CW - 80)
      const y1 = 140 + r() * 390
      s += line(x1, y1, x1 + (r() - 0.5) * 220, y1 + (r() - 0.5) * 160, C.steel, 1, 0.35)
    }
    for (let i = 0; i < 3; i++) {
      s += rect(X + i * ((CW + 24) / 3), 598, (CW - 48) / 3, 270, C.ash, 10)
      s += rect(X + i * ((CW + 24) / 3), 598, (CW - 48) / 3, 270, C.smoke, 10, 0.3)
      s += mono(X + 24 + i * ((CW + 24) / 3), 632, ['LOAD', 'DISTANCE', 'FUEL'][i], { size: 8.5 })
      s += text(X + 24 + i * ((CW + 24) / 3), 686, ['74%', '18.2k', '92%'][i], { size: 34, weight: 700, fill: i === 1 ? accent : C.bone })
      const bw = (CW - 48) / 3 - 48
      for (let j = 0; j < 12; j++) {
        const bh = 20 + r() * 90
        s += rect(X + 24 + i * ((CW + 24) / 3) + j * (bw / 12), 830 - bh, bw / 12 - 5, bh, C.steel, 2, 0.6)
      }
    }
  } else if (layout === 2) {
    // charts drawing
    for (let k = 0; k < 2; k++) {
      const x = X + k * ((CW + 24) / 2)
      const w = (CW - 24) / 2
      s += rect(x, 100, w, 340, C.ash, 10)
      s += rect(x, 100, w, 340, C.smoke, 10, 0.3)
      s += text(x + 24, 138, ['Latency distribution', 'Error budget'][k], { size: 14, weight: 600 })
      let p = ''
      for (let i = 0; i < 12; i++) {
        const px = x + 30 + (i * (w - 60)) / 11
        const py = 400 - (0.15 + r() * 0.8) * 220
        p += `${i === 0 ? 'M' : 'L'}${f(px)} ${f(py)} `
      }
      s += `<path d="${p}" fill="none" stroke="${k === 0 ? accent : C.halo}" stroke-width="2.5" stroke-linecap="round"/>`
      s += `<path d="${p}L${f(x + w - 30)} 410 L${f(x + 30)} 410 Z" fill="${k === 0 ? accent : C.halo}" opacity="0.09"/>`
    }
    // donut + list
    s += rect(X, 464, 420, 404, C.ash, 10)
    s += circle(X + 210, 640, 110, C.smoke, 0.6)
    const segs = [[0, 0.42, accent], [0.42, 0.68, C.halo], [0.68, 0.86, C.sage], [0.86, 1, C.steel]]
    segs.forEach(([a, b, col]) => {
      const len = (b - a) * 691
      s += `<circle cx="${X + 210}" cy="640" r="110" fill="none" stroke="${col}" stroke-width="26" stroke-dasharray="${f(
        len,
      )} 691" stroke-dashoffset="${f(-a * 691)}" transform="rotate(-90 ${X + 210} 640)"/>`
    })
    s += circle(X + 210, 640, 84, C.ash)
    s += text(X + 210, 634, '482k', { size: 34, weight: 700, anchor: 'middle' })
    s += mono(X + 210, 660, 'EVENTS', { size: 9, anchor: 'middle' })
    s += rect(X + 444, 464, CW - 444, 404, C.ash, 10)
    for (let i = 0; i < 7; i++) {
      const y = 508 + i * 52
      s += rect(X + 468, y, 8, 8, [accent, C.halo, C.sage, C.steel, accent, C.halo, C.sage][i], 2)
      s += rect(X + 490, y - 2, 200 + r() * 120, 6, C.silver, 3, 0.8)
      s += text(X + CW - 24, y + 6, `${(r() * 100).toFixed(1)}%`, { size: 12, anchor: 'end', fill: C.mist })
      s += line(X + 468, y + 22, X + CW - 24, y + 22, C.smoke, 1, 0.4)
    }
  } else {
    // detail panel dominant
    s += rect(X, 100, CW, H - 132, C.ash, 10)
    s += rect(X, 100, CW, H - 132, C.smoke, 10, 0.3)
    s += mono(X + 32, 146, 'UNIT-1842 / EU-WEST', { size: 9, fill: accent })
    s += text(X + 32, 196, 'Fleet unit detail', { size: 30, weight: 600 })
    s += rect(X + 32, 230, CW - 64, 300, C.carbon, 8)
    for (let i = 0; i < 6; i++) s += line(X + 56, 270 + i * 44, X + CW - 56, 270 + i * 44, C.steel, 1, 0.28)
    let p2 = ''
    let p3 = ''
    for (let i = 0; i < 30; i++) {
      const px = X + 56 + (i * (CW - 112)) / 29
      p2 += `${i === 0 ? 'M' : 'L'}${f(px)} ${f(500 - (0.1 + r() * 0.85) * 210)} `
      p3 += `${i === 0 ? 'M' : 'L'}${f(px)} ${f(500 - (0.05 + r() * 0.5) * 210)} `
    }
    s += `<path d="${p3}" fill="none" stroke="${C.halo}" stroke-width="1.6" opacity="0.55"/>`
    s += `<path d="${p2}" fill="none" stroke="${accent}" stroke-width="2.4"/>`
    for (let i = 0; i < 4; i++) {
      const x = X + 32 + i * ((CW - 64 + 20) / 4)
      s += rect(x, 562, (CW - 64 - 60) / 4, 106, C.carbon, 8)
      s += mono(x + 20, 594, ['TEMP', 'LOAD', 'SIGNAL', 'BATTERY'][i], { size: 8.5 })
      s += text(x + 20, 638, ['41°C', '68%', '-72dB', '88%'][i], { size: 26, weight: 600, fill: i === 3 ? C.sage : C.bone })
    }
    s += rect(X + 32, 696, CW - 64, 140, C.carbon, 8)
    for (let i = 0; i < 3; i++) {
      s += rect(X + 56, 724 + i * 38, 6, 6, [C.rose, accent, C.mist][i], 3)
      s += rect(X + 76, 721 + i * 38, 300 + r() * 200, 6, C.steel, 3, 0.7)
      s += mono(X + CW - 56, 728 + i * 38, `${String(i + 9).padStart(2, '0')}:${Math.floor(r() * 59)}`, { size: 9, anchor: 'end' })
    }
  }

  return wrap(W, H, s, { bg: C.carbon })
}

/** Creative canvas — photo retouch, poster, video frame, AI flow. */
function creativeScreen({ seed, kind, title, index, accent = C.brass }) {
  const r = rng(seed)
  const W = 1440
  const H = 900
  let s = ''

  if (kind === 'photo') {
    // editor chrome + image
    s += rect(0, 0, W, 44, C.graphite)
    s += line(0, 44, W, 44, C.smoke, 1)
    ;['FILE', 'EDIT', 'IMAGE', 'LAYER', 'FILTER'].forEach((m, i) => (s += mono(24 + i * 78, 27, m, { size: 8.5 })))
    s += rect(0, 44, 64, H - 44, C.graphite)
    for (let i = 0; i < 9; i++) {
      const on = i === 3
      if (on) s += rect(12, 68 + i * 52, 40, 40, C.smoke, 8)
      s += rect(24, 80 + i * 52, 16, 16, on ? accent : C.steel, 3)
    }
    s += rect(W - 280, 44, 280, H - 44, C.graphite)
    s += mono(W - 256, 76, 'LAYERS', { size: 9, fill: accent })
    const layers = ['Grade — Curve', 'Retouch — Skin', 'Mask — Subject', 'Background', 'Original']
    layers.forEach((l, i) => {
      s += rect(W - 256, 92 + i * 60, 232, 50, i === 0 ? C.smoke : C.ash, 6)
      s += rect(W - 246, 100 + i * 60, 34, 34, `url(#g-img)`, 4)
      s += text(W - 202, 122 + i * 60, l, { size: 11.5, fill: i === 0 ? C.bone : C.silver })
      s += circle(W - 40, 117 + i * 60, 4, i < 3 ? C.sage : C.steel)
    })
    s += mono(W - 256, 452, 'HISTOGRAM', { size: 9 })
    for (let i = 0; i < 44; i++) {
      const bh = 8 + Math.sin(i / 6) * 30 + r() * 44
      s += rect(W - 256 + i * 5.3, 560 - bh, 4, bh, C.steel, 1, 0.7)
    }
    s += mono(W - 256, 600, 'CURVES', { size: 9 })
    s += rect(W - 256, 612, 232, 180, C.carbon, 4)
    s += line(W - 256, 792, W - 24, 612, C.steel, 1, 0.4)
    s += `<path d="M${W - 256} 792 C ${W - 190} 720, ${W - 130} 690, ${W - 24} 612" fill="none" stroke="${accent}" stroke-width="2"/>`
    ;[[W - 190, 728], [W - 120, 672]].forEach(([px, py]) => (s += circle(px, py, 4.5, accent)))

    // canvas + image
    const ix = 120
    const iy = 96
    const iw = W - 280 - 120 - 56
    const ih = H - 200
    s += rect(ix - 12, iy - 12, iw + 24, ih + 24, C.void, 2)
    s += rect(ix, iy, iw, ih, `url(#g-img)`, 0)
    // "photograph": abstract portrait-ish composition
    s += `<ellipse cx="${f(ix + iw * 0.42)}" cy="${f(iy + ih * 0.46)}" rx="${f(iw * 0.19)}" ry="${f(
      ih * 0.3,
    )}" fill="${C.mist}" opacity="0.5"/>`
    s += `<ellipse cx="${f(ix + iw * 0.42)}" cy="${f(iy + ih * 0.26)}" rx="${f(iw * 0.1)}" ry="${f(
      ih * 0.14,
    )}" fill="${C.silver}" opacity="0.55"/>`
    s += `<rect x="${f(ix + iw * 0.58)}" y="${f(iy + ih * 0.2)}" width="${f(iw * 0.3)}" height="${f(
      ih * 0.6,
    )}" fill="${accent}" opacity="0.14"/>`
    for (let i = 0; i < 5; i++) {
      s += line(ix + 20, iy + 40 + i * (ih / 5.5), ix + iw - 20, iy + 70 + i * (ih / 5.5), C.bone, 1, 0.05)
    }
    if (index >= 1) {
      // selection mask marching-ants
      s += `<ellipse cx="${f(ix + iw * 0.42)}" cy="${f(iy + ih * 0.4)}" rx="${f(iw * 0.21)}" ry="${f(
        ih * 0.34,
      )}" fill="none" stroke="${C.bone}" stroke-width="1.5" stroke-dasharray="7 6"/>`
    }
    if (index >= 2) {
      // before/after split
      s += line(ix + iw / 2, iy, ix + iw / 2, iy + ih, C.bone, 2, 0.9)
      s += circle(ix + iw / 2, iy + ih / 2, 18, C.void, 0.85)
      s += circle(ix + iw / 2, iy + ih / 2, 17, C.bone, 0.25)
      s += rect(ix + iw / 2 - 6, iy + ih / 2 - 4, 3, 8, C.bone, 1)
      s += rect(ix + iw / 2 + 3, iy + ih / 2 - 4, 3, 8, C.bone, 1)
      s += rect(ix, iy, iw / 2, ih, C.void, 0, 0.22)
      s += mono(ix + 20, iy + 30, 'BEFORE', { size: 9, fill: C.bone })
      s += mono(ix + iw - 20, iy + 30, 'AFTER', { size: 9, fill: accent, anchor: 'end' })
    }
    if (index >= 3) {
      s += rect(ix, iy + ih - 56, iw, 56, C.void, 0, 0.7)
      s += mono(ix + 20, iy + ih - 22, `${title.toUpperCase()} — FRAME ${String(index + 1).padStart(3, '0')} / 800`, {
        size: 9,
        fill: C.silver,
      })
    }
    return wrap(W, H, s, { bg: C.void })
  }

  if (kind === 'poster') {
    const variants = index % 4
    if (variants === 0) {
      s += rect(0, 0, W, H, C.carbon)
      s += rect(120, 80, 560, 740, `url(#g-img)`, 0)
      s += rect(120, 80, 560, 740, accent, 0, 0.12)
      s += text(740, 260, 'VER', { size: 150, weight: 800, spacing: -8, fill: C.bone })
      s += text(740, 400, 'TEX', { size: 150, weight: 800, spacing: -8, fill: accent })
      s += line(740, 450, 1360, 450, C.smoke, 1)
      s += mono(740, 486, 'ROBOTICS / IDENTITY SYSTEM', { size: 11, fill: C.silver })
      s += text(740, 560, 'A system of', { size: 30, weight: 400, fill: C.silver, family: 'Instrument Serif, Georgia, serif' })
      s += text(740, 600, 'rules, not layouts.', { size: 30, weight: 400, fill: C.silver, family: 'Instrument Serif, Georgia, serif' })
      s += mono(740, 800, '2024 — GENTECHNE', { size: 10 })
    } else if (variants === 1) {
      s += rect(0, 0, W, H, C.void)
      for (let i = 0; i < 12; i++) s += line(120 + i * 100, 60, 120 + i * 100, 840, C.steel, 1, 0.25)
      for (let i = 0; i < 8; i++) s += line(120, 60 + i * 112, 1320, 60 + i * 112, C.steel, 1, 0.25)
      s += rect(220, 172, 400, 400, accent, 0, 0.9)
      s += circle(820, 372, 200, C.bone, 0.9)
      s += rect(420, 620, 600, 112, C.halo, 0, 0.75)
      s += text(120, 830, 'COMPOSITION 04', { size: 20, weight: 600, spacing: 4 })
    } else if (variants === 2) {
      s += rect(0, 0, W, H, C.carbon)
      const words = ['DESIGN', 'CODE', 'MOTION']
      words.forEach((w2, i) => {
        s += text(110, 300 + i * 190, w2, { size: 170, weight: 800, spacing: -9, fill: i === 1 ? accent : C.bone, opacity: 1 - i * 0.15 })
      })
      s += rect(980, 120, 340, 640, `url(#g-img)`, 0)
      s += rect(980, 120, 340, 640, C.void, 0, 0.3)
    } else {
      s += rect(0, 0, W, H, C.void)
      // banner size grid
      const sizes = [
        [80, 100, 400, 300],
        [520, 100, 300, 300],
        [860, 100, 480, 130],
        [860, 260, 480, 140],
        [80, 440, 260, 380],
        [380, 440, 440, 380],
        [860, 440, 480, 180],
        [860, 650, 480, 170],
      ]
      sizes.forEach(([x, y, w2, h2], i) => {
        s += rect(x, y, w2, h2, C.ash, 2)
        s += rect(x, y, w2, h2, i % 3 === 0 ? accent : C.smoke, 2, i % 3 === 0 ? 0.16 : 0.4)
        s += `<rect x="${x}" y="${y}" width="${w2}" height="${h2}" fill="none" stroke="${C.steel}" stroke-width="1" opacity="0.5"/>`
        s += text(x + 16, y + 38, ['VER', 'TEX'][i % 2], { size: Math.min(w2, h2) * 0.16, weight: 800, fill: i % 3 === 0 ? accent : C.bone })
        s += mono(x + 16, y + h2 - 14, `${w2 * 2}×${h2 * 2}`, { size: 8 })
      })
    }
    return wrap(W, H, s, { bg: C.void })
  }

  if (kind === 'video') {
    // NLE
    s += rect(0, 0, W, 40, C.graphite)
    s += mono(24, 25, 'HALCYON_MASTER_v14.prproj', { size: 9, fill: C.silver })
    s += mono(W - 24, 25, '00:01:32:04 — 23.976', { size: 9, anchor: 'end' })
    // preview
    const pw = 780
    s += rect(40, 62, pw, 440, C.void, 4)
    s += rect(40, 62, pw, 440, `url(#g-img)`, 4, 0.9)
    s += `<ellipse cx="${40 + pw * 0.5}" cy="282" rx="200" ry="150" fill="${accent}" opacity="0.1"/>`
    s += rect(40 + pw * 0.28, 150, pw * 0.44, 264, C.void, 2, 0.35)
    s += circle(40 + pw / 2, 282, 42, C.bone, 0.12)
    s += `<path d="M${f(40 + pw / 2 - 12)} 264 L${f(40 + pw / 2 + 18)} 282 L${f(40 + pw / 2 - 12)} 300 Z" fill="${C.bone}" opacity="0.85"/>`
    s += rect(40, 470, pw, 32, C.void, 0, 0.6)
    s += rect(56, 484, pw - 32, 3, C.steel, 2)
    s += rect(56, 484, (pw - 32) * (0.2 + (index % 3) * 0.3), 3, accent, 2)
    // scopes
    s += rect(pw + 60, 62, W - pw - 100, 200, C.ash, 6)
    s += mono(pw + 84, 92, 'SCOPES / WAVEFORM', { size: 8.5, fill: accent })
    for (let i = 0; i < 58; i++) {
      const bh = 10 + Math.abs(Math.sin(i / 5)) * 60 + r() * 30
      s += rect(pw + 84 + i * 8.4, 240 - bh, 5, bh, C.sage, 1, 0.35)
    }
    s += rect(pw + 60, 278, W - pw - 100, 224, C.ash, 6)
    s += mono(pw + 84, 308, 'EFFECT CONTROLS', { size: 8.5, fill: accent })
    ;['Opacity', 'Scale', 'Position', 'Blur', 'Lumetri'].forEach((e, i) => {
      s += text(pw + 84, 340 + i * 34, e, { size: 11, fill: C.silver })
      s += rect(pw + 190, 334 + i * 34, 180, 4, C.steel, 2)
      s += circle(pw + 190 + 180 * (0.25 + r() * 0.65), 336 + i * 34, 6, accent)
    })
    // timeline
    s += rect(0, 522, W, H - 522, C.graphite)
    s += line(0, 522, W, 522, C.smoke, 1)
    for (let i = 0; i < 15; i++) {
      s += line(180 + i * 84, 530, 180 + i * 84, 548, C.steel, 1, 0.6)
      s += mono(184 + i * 84, 544, `00:${String(i * 6).padStart(2, '0')}`, { size: 7.5 })
    }
    const tracks = [
      { y: 560, h: 62, label: 'V2', clips: [[180, 250, C.halo], [470, 190, C.halo]] },
      { y: 630, h: 74, label: 'V1', clips: [[180, 320, accent], [520, 260, accent], [800, 380, accent], [1200, 200, accent]] },
      { y: 712, h: 46, label: 'A1', clips: [[180, 1000, C.sage]] },
      { y: 766, h: 46, label: 'A2', clips: [[300, 700, C.sage]] },
    ]
    tracks.forEach((t) => {
      s += rect(0, t.y, 168, t.h, C.ash, 0)
      s += mono(24, t.y + t.h / 2 + 4, t.label, { size: 9, fill: C.silver })
      s += rect(168, t.y, W - 168, t.h, C.carbon, 0)
      t.clips.forEach(([x, w2, col], ci) => {
        const selected = t.label === 'V1' && ci === 1
        s += rect(x, t.y + 4, w2, t.h - 8, col, 3, selected ? 0.55 : 0.3)
        s += `<rect x="${x}" y="${f(t.y + 4)}" width="${w2}" height="${f(t.h - 8)}" rx="3" fill="none" stroke="${
          selected ? C.bone : col
        }" stroke-width="${selected ? 2 : 1}" opacity="${selected ? 1 : 0.6}"/>`
        s += mono(x + 10, t.y + 20, `CLIP_${String(ci + 1).padStart(2, '0')}`, { size: 7.5, fill: C.bone })
        if (t.label.startsWith('A')) {
          let wf = ''
          for (let i = 0; i < w2 / 4; i++) {
            const a = Math.abs(Math.sin(i / 3 + ci)) * (t.h / 3)
            wf += `M${f(x + i * 4)} ${f(t.y + t.h / 2 - a)} L${f(x + i * 4)} ${f(t.y + t.h / 2 + a)} `
          }
          s += `<path d="${wf}" stroke="${C.sage}" stroke-width="1.2" opacity="0.65"/>`
        }
      })
    })
    // playhead
    const phx = 180 + ((index % 3) + 1) * 210
    s += line(phx, 526, phx, H, accent, 2)
    s += `<path d="M${phx - 7} 526 L${phx + 7} 526 L${phx} 540 Z" fill="${accent}"/>`
    return wrap(W, H, s, { bg: C.carbon })
  }

  // AI flow
  s += rect(0, 0, W, H, C.void)
  s += mono(64, 64, 'ORBIT / SUPPORT AUTOMATION — RUN 4,182', { size: 10, fill: accent })
  const nodes = [
    { x: 150, y: 300, w: 210, h: 110, t: 'INPUT', l: 'Ticket received', c: C.halo },
    { x: 150, y: 470, w: 210, h: 110, t: 'INPUT', l: 'Docs index', c: C.halo },
    { x: 470, y: 380, w: 230, h: 120, t: 'RETRIEVE', l: 'pgvector search', c: C.bone },
    { x: 800, y: 250, w: 250, h: 130, t: 'REASON', l: 'Claude · draft reply', c: accent },
    { x: 800, y: 470, w: 250, h: 120, t: 'EVALUATE', l: 'Accuracy gate', c: accent },
    { x: 1160, y: 300, w: 210, h: 110, t: 'OUTPUT', l: 'Auto-resolve', c: C.sage },
    { x: 1160, y: 470, w: 210, h: 110, t: 'OUTPUT', l: 'Escalate to human', c: C.mist },
  ]
  const edges = [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6]]
  edges.forEach(([a, b]) => {
    const n1 = nodes[a]
    const n2 = nodes[b]
    const x1 = n1.x + n1.w
    const y1 = n1.y + n1.h / 2
    const x2 = n2.x
    const y2 = n2.y + n2.h / 2
    const mx = (x1 + x2) / 2
    s += `<path d="M${f(x1)} ${f(y1)} C ${f(mx)} ${f(y1)}, ${f(mx)} ${f(y2)}, ${f(x2)} ${f(y2)}" fill="none" stroke="${
      C.steel
    }" stroke-width="1.5" opacity="0.75"/>`
    s += circle(mx, (y1 + y2) / 2, 3.5, accent, 0.9)
  })
  nodes.forEach((n, i) => {
    s += rect(n.x, n.y, n.w, n.h, C.ash, 8)
    s += rect(n.x, n.y, n.w, n.h, C.smoke, 8, 0.4)
    s += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="8" fill="none" stroke="${n.c}" stroke-width="1" opacity="${
      i === (index % 4) + 2 ? 0.9 : 0.28
    }"/>`
    s += rect(n.x, n.y, 3, n.h, n.c, 2, 0.85)
    s += mono(n.x + 18, n.y + 28, n.t, { size: 8.5, fill: n.c })
    s += text(n.x + 18, n.y + 56, n.l, { size: 13, weight: 500, fill: C.bone })
    s += rect(n.x + 18, n.y + 72, n.w - 60, 5, C.steel, 2.5, 0.55)
    s += rect(n.x + 18, n.y + 84, n.w - 110, 5, C.steel, 2.5, 0.35)
  })
  s += line(64, 720, W - 64, 720, C.smoke, 1)
  ;[['RESOLVED', '34%'], ['LATENCY', '1.8s'], ['ACCURACY', '96.2%'], ['SAVED / WK', '31 hrs']].forEach(([k, v], i) => {
    s += mono(64 + i * 330, 764, k, { size: 9 })
    s += text(64 + i * 330, 812, v, { size: 34, weight: 700, fill: i === 0 ? accent : C.bone })
  })
  return wrap(W, H, s, { bg: C.void })
}

/**
 * Photographic plate — a campaign frame, not a screenshot.
 * `graded` swaps the flat capture look for the delivered colour grade, which is
 * what the photo-editing world cross-fades between.
 */
function photoPlate({ seed, index, graded = false }) {
  const r = rng(seed)
  const W = 1400
  const H = 933
  let s = ''
  const key = graded ? C.brass : '#5A6068'
  const fill = graded ? C.halo : '#4A4E56'

  s += `<defs>
    <linearGradient id="pp${index}-sky" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${graded ? '#2A2620' : '#33363C'}"/>
      <stop offset="55%" stop-color="${graded ? '#15130F' : '#1D1F23'}"/>
      <stop offset="100%" stop-color="${graded ? '#080705' : '#0E0F12'}"/>
    </linearGradient>
    <radialGradient id="pp${index}-key" cx="0.62" cy="0.26" r="0.62">
      <stop offset="0%" stop-color="${key}" stop-opacity="${graded ? 0.42 : 0.18}"/>
      <stop offset="100%" stop-color="${key}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pp${index}-fill" cx="0.16" cy="0.86" r="0.6">
      <stop offset="0%" stop-color="${fill}" stop-opacity="${graded ? 0.2 : 0.12}"/>
      <stop offset="100%" stop-color="${fill}" stop-opacity="0"/>
    </radialGradient>
  </defs>`

  s += rect(0, 0, W, H, `url(#pp${index}-sky)`)

  // Backdrop planes — a set built from flats, lit from the right.
  for (let i = 0; i < 5; i++) {
    const x = -120 + i * 300 + r() * 90
    const w = 190 + r() * 260
    s += rect(x, 40 + r() * 120, w, H, graded ? '#1C1813' : '#22242A', 0, 0.32 + r() * 0.26)
  }
  s += rect(0, H * 0.72, W, H * 0.28, graded ? '#100D09' : '#15171B', 0, 0.9)

  // Subject: a figure, shoulders up, three-quarter turn.
  const cx = W * (0.38 + index * 0.045)
  const base = H * 1.02
  s += `<ellipse cx="${f(cx)}" cy="${f(base - 210)}" rx="215" ry="285" fill="${
    graded ? '#3A2E23' : '#3A3E45'
  }" opacity="0.92"/>`
  s += `<ellipse cx="${f(cx + 14)}" cy="${f(base - 470)}" rx="112" ry="140" fill="${
    graded ? '#4A3A2B' : '#474B53'
  }" opacity="0.95"/>`
  // Rim light along the key side
  s += `<path d="M${f(cx + 96)} ${f(base - 590)} Q ${f(cx + 150)} ${f(base - 430)}, ${f(cx + 120)} ${f(
    base - 300,
  )}" fill="none" stroke="${graded ? C.brass : C.silver}" stroke-width="9" opacity="${
    graded ? 0.55 : 0.22
  }" stroke-linecap="round"/>`
  // Hair / edge detail
  for (let i = 0; i < 22; i++) {
    const a = -0.9 + (i / 22) * 1.9
    s += `<path d="M${f(cx + Math.sin(a) * 96)} ${f(base - 560 + Math.cos(a) * 40)} q ${f(
      Math.sin(a) * 40,
    )} ${f(-30 - r() * 40)}, ${f(Math.sin(a) * 66)} ${f(-70 - r() * 60)}" fill="none" stroke="${
      graded ? '#6A5335' : '#5A5E66'
    }" stroke-width="${f(1 + r() * 2)}" opacity="${f(0.16 + r() * 0.24)}"/>`
  }

  // Product / prop
  s += rect(W * 0.68, H * 0.42, 128, 300, graded ? '#2A2018' : '#2A2C31', 8, 0.95)
  s += rect(W * 0.68, H * 0.42, 128, 300, key, 8, graded ? 0.3 : 0.1)
  s += rect(W * 0.695, H * 0.47, 96, 8, graded ? C.brass : C.silver, 4, graded ? 0.75 : 0.3)

  s += rect(0, 0, W, H, `url(#pp${index}-key)`)
  s += rect(0, 0, W, H, `url(#pp${index}-fill)`)

  // Vignette
  s += `<radialGradient id="pp${index}-vig" cx="0.5" cy="0.48" r="0.72">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="${graded ? 0.68 : 0.45}"/>
    </radialGradient>`
  s += rect(0, 0, W, H, `url(#pp${index}-vig)`)

  // Film grain
  for (let i = 0; i < 900; i++) {
    s += rect(r() * W, r() * H, 2, 2, r() > 0.5 ? C.bone : '#000', 0, r() * 0.055)
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">${s}</svg>`
}

/**
 * Studio editorial images. These sit behind text at large sizes, so they need
 * real tonal range — a dark room still has lit surfaces, rim light on figures
 * and glowing screens. An almost-black rectangle reads as a loading failure,
 * not as atmosphere.
 */
function studioImage(i) {
  const r = rng(hash(`studio-${i}`))
  const W = 1200
  const H = i % 2 === 0 ? 1500 : 800
  let s = ''
  const tint = [C.brass, C.halo, C.sage, C.lilac, C.brass][i % 5]
  const floor = H * 0.78

  s += `<defs>
    <linearGradient id="wall${i}" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#3A3A44"/>
      <stop offset="45%" stop-color="#26262E"/>
      <stop offset="100%" stop-color="#15151A"/>
    </linearGradient>
    <linearGradient id="floor${i}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2A2A32"/>
      <stop offset="100%" stop-color="#101014"/>
    </linearGradient>
    <radialGradient id="key${i}" cx="0.72" cy="0.18" r="0.68">
      <stop offset="0%" stop-color="${tint}" stop-opacity="0.42"/>
      <stop offset="55%" stop-color="${tint}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${tint}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vig${i}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.34"/>
      <stop offset="42%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.62"/>
    </linearGradient>
  </defs>`

  // Room
  s += rect(0, 0, W, H, `url(#wall${i})`)
  s += rect(0, floor, W, H - floor, `url(#floor${i})`)
  s += line(0, floor, W, floor, '#4A4A56', 2, 0.6)

  // Structural bays — vertical mullions catching light
  for (let k = 0; k < 5; k++) {
    const x = k * (W / 5) + 30 + r() * 40
    s += rect(x, 0, 10 + r() * 16, floor, '#43434F', 0, 0.32 + r() * 0.25)
    s += rect(x + 14, 0, 3, floor, C.bone, 0, 0.07)
  }

  // Wall of pinned work — the brightest objects in frame
  const pins = 6
  for (let k = 0; k < pins; k++) {
    const pw = 150 + r() * 120
    const ph = pw * (0.62 + r() * 0.5)
    const x = 60 + r() * (W - pw - 120)
    const y = 70 + r() * (floor * 0.42)
    s += rect(x + 5, y + 7, pw, ph, '#000', 3, 0.45)
    s += rect(x, y, pw, ph, '#EDEDF0', 3, 0.9)
    s += rect(x, y, pw, ph, '#1A1A20', 3, 0.12)
    // content inside the print
    s += rect(x + 12, y + 12, pw - 24, ph * 0.45, tint, 2, 0.5)
    for (let j = 0; j < 3; j++) {
      s += rect(x + 12, y + ph * 0.55 + j * 12, (pw - 24) * (0.9 - j * 0.24), 5, '#3A3A44', 2.5, 0.85)
    }
  }

  // Lit screens
  for (let k = 0; k < 2; k++) {
    const sw = 220 + r() * 150
    const sh = sw * 0.6
    const x = 80 + r() * (W - sw - 160)
    const y = floor - sh - 120 - r() * 90
    s += rect(x - 6, y - 6, sw + 12, sh + 12, '#0A0A0D', 6)
    s += rect(x, y, sw, sh, '#1C2733', 3)
    s += rect(x, y, sw, sh, tint, 3, 0.3)
    for (let j = 0; j < 5; j++) {
      s += rect(x + 14, y + 16 + j * (sh / 6), (sw - 28) * (0.35 + r() * 0.6), 6, C.bone, 3, 0.35 + r() * 0.35)
    }
    // screen spill onto the surface below
    s += `<ellipse cx="${f(x + sw / 2)}" cy="${f(y + sh + 40)}" rx="${f(sw * 0.75)}" ry="46" fill="${tint}" opacity="0.16"/>`
  }

  // Figures — silhouettes with rim light, at human scale
  const figs = i % 2 === 0 ? 2 : 3
  for (let k = 0; k < figs; k++) {
    const cx = W * (0.2 + k * 0.28) + r() * 70
    const scale = 0.9 + r() * 0.35
    const headY = floor - 300 * scale
    // body
    s += `<path d="M${f(cx - 62 * scale)} ${f(floor + 10)} C ${f(cx - 66 * scale)} ${f(
      headY + 70,
    )}, ${f(cx - 34 * scale)} ${f(headY + 34)}, ${f(cx)} ${f(headY + 30)} C ${f(cx + 34 * scale)} ${f(
      headY + 34,
    )}, ${f(cx + 66 * scale)} ${f(headY + 70)}, ${f(cx + 62 * scale)} ${f(floor + 10)} Z" fill="#0C0C10" opacity="0.94"/>`
    s += `<circle cx="${f(cx)}" cy="${f(headY)}" r="${f(34 * scale)}" fill="#0C0C10" opacity="0.95"/>`
    // rim light on the key side
    s += `<path d="M${f(cx + 30 * scale)} ${f(headY - 22 * scale)} A ${f(34 * scale)} ${f(
      34 * scale,
    )} 0 0 1 ${f(cx + 24 * scale)} ${f(headY + 26 * scale)}" fill="none" stroke="${tint}" stroke-width="${f(
      5 * scale,
    )}" opacity="0.7" stroke-linecap="round"/>`
    s += `<path d="M${f(cx + 58 * scale)} ${f(headY + 90)} L ${f(cx + 60 * scale)} ${f(
      floor - 10,
    )}" stroke="${tint}" stroke-width="${f(4 * scale)}" opacity="0.42" stroke-linecap="round"/>`
    // contact shadow
    s += `<ellipse cx="${f(cx)}" cy="${f(floor + 12)}" rx="${f(90 * scale)}" ry="14" fill="#000" opacity="0.5"/>`
  }

  // Table with proofs, foreground
  s += rect(0, floor + 40, W, 10, '#3A3A44', 0, 0.5)
  for (let k = 0; k < 4; k++) {
    const pw = 130 + r() * 110
    const x = 40 + k * (W / 4) + r() * 40
    s += `<g transform="rotate(${f((r() - 0.5) * 16)} ${f(x + pw / 2)} ${f(floor + 120)})">`
    s += rect(x, floor + 70, pw, pw * 0.72, '#E4E4E8', 2, 0.85)
    s += rect(x + 10, floor + 80, pw - 20, pw * 0.3, tint, 1, 0.55)
    s += '</g>'
  }

  s += rect(0, 0, W, H, `url(#key${i})`)
  s += rect(0, 0, W, H, `url(#vig${i})`)

  // Film grain
  for (let k = 0; k < 900; k++) {
    s += rect(r() * W, r() * H, 2, 2, r() > 0.45 ? C.bone : '#000', 0, r() * 0.07)
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">${s}</svg>`
}

/* ══════════════════════════════════════════════════════════
   OUTPUT
   ══════════════════════════════════════════════════════════ */

const write = (rel, content) => {
  const full = resolve(PUBLIC, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content, 'utf8')
  return rel
}

const jobs = [
  /* ── GENTECHNE's own products ──────────────────────────────
     Placeholder artwork for real projects. Replace any file with a real
     screenshot of the same name and it is picked up with no code change. */
  { dir: 'projects/own/vetician', n: 4, kind: 'phone', title: 'Vetician', accent: C.sage, screens: ['Home', 'Vets', 'Booking', 'Records'] },
  { dir: 'projects/own/aivet', n: 4, kind: 'flow', title: 'AiVet', accent: C.halo },
  { dir: 'projects/own/tezbuy', n: 4, kind: 'store', title: 'TezBuy', accent: C.brass },
  { dir: 'projects/own/smart-library', n: 4, kind: 'dash', title: 'Smart Library', accent: C.lilac },
  { dir: 'projects/own/college-dispensary', n: 3, kind: 'dash', title: 'Dispensary', accent: C.sage },
  { dir: 'projects/own/agentic-astro', n: 3, kind: 'flow', title: 'Agentic Astro', accent: C.lilac },
  { dir: 'projects/own/help-desk', n: 3, kind: 'dash', title: 'Help Desk', accent: C.halo },
  { dir: 'projects/own/gym-management', n: 4, kind: 'phone', title: 'Gym', accent: C.brass, screens: ['Today', 'Plan', 'Members', 'Billing'] },

  // App
  { dir: 'projects/app/meridian-health', n: 5, kind: 'phone', title: 'Meridian', accent: C.brass, screens: ['Today', 'Vitals', 'Chart', 'Rounds', 'Sync'] },
  { dir: 'projects/app/lattice-finance', n: 4, kind: 'phone', title: 'Lattice', accent: C.sage, screens: ['This week', 'Spending', 'Trends', 'Goals'] },
  { dir: 'projects/app/transit-atlas', n: 4, kind: 'phone', title: 'Atlas', accent: C.halo, screens: ['Nearby', 'Route', 'Live', 'Saved'] },
  // Web
  { dir: 'projects/web/obsidian-architects', n: 4, kind: 'web', title: 'Obsidian', accent: C.brass },
  { dir: 'projects/web/northwind-labs', n: 3, kind: 'web', title: 'Northwind', accent: C.halo },
  { dir: 'projects/web/form-and-field', n: 4, kind: 'web', title: 'Form & Field', accent: C.sage },
  // Shopify
  { dir: 'projects/shopify/ashgrove-supply', n: 4, kind: 'store', title: 'Ashgrove', accent: C.sage },
  { dir: 'projects/shopify/maison-cerise', n: 3, kind: 'store', title: 'Maison Cerise', accent: C.rose },
  // WordPress
  { dir: 'projects/wordpress/chronicle-press', n: 4, kind: 'cms', title: 'Chronicle Press', accent: C.lilac },
  // SaaS
  { dir: 'projects/saas/signalyard', n: 5, kind: 'dash', title: 'Signalyard', accent: C.brass },
  { dir: 'projects/saas/quorum-desk', n: 3, kind: 'dash', title: 'Quorum', accent: C.halo },
  // Creative
  // 01 = flat capture, 02 = delivered grade, 03/04 = further frames.
  // The photo world cross-fades 01 → 02, so these two must be the same frame.
  { dir: 'projects/creative/aurelia-campaign', n: 4, kind: 'plate', title: 'Aurelia', accent: C.rose },
  // Film FRAMES, not editor screenshots — the video world supplies its own NLE
  // chrome, so these must be the footage it is cutting.
  { dir: 'projects/creative/halcyon-film', n: 4, kind: 'plate', title: 'Halcyon', accent: C.brass },
  { dir: 'projects/creative/vertex-identity', n: 4, kind: 'poster', title: 'Vertex', accent: C.brass },
  { dir: 'projects/creative/orbit-automation', n: 3, kind: 'flow', title: 'Orbit', accent: C.brass },
]

let count = 0
for (const job of jobs) {
  for (let i = 0; i < job.n; i++) {
    const seed = hash(`${job.dir}-${i}`)
    const name = `${String(i + 1).padStart(2, '0')}.svg`
    let svg
    if (job.kind === 'phone') {
      svg = phoneScreen({ seed, title: job.title, screen: job.screens[i], accent: job.accent, index: i })
    } else if (job.kind === 'web') {
      svg = webScreen({ seed, title: job.title, accent: job.accent, index: i })
    } else if (job.kind === 'store') {
      svg = storeScreen({ seed, title: job.title, accent: job.accent, index: i })
    } else if (job.kind === 'cms') {
      svg = cmsScreen({ seed, title: job.title, accent: job.accent, index: i })
    } else if (job.kind === 'dash') {
      svg = dashScreen({ seed, title: job.title, accent: job.accent, index: i })
    } else if (job.kind === 'plate') {
      // For the retouch project, 01 and 02 must be the SAME frame ungraded /
      // graded — the photo world cross-fades between them as a before/after.
      const pair = job.dir.includes('aurelia')
      const seedForPair = pair && i < 2 ? hash(`${job.dir}-pair`) : seed
      svg = photoPlate({ seed: seedForPair, index: i, graded: pair ? i !== 0 : true })
    } else {
      svg = creativeScreen({ seed, kind: job.kind, title: job.title, index: i, accent: job.accent })
    }
    write(`${job.dir}/${name}`, svg)
    count++
  }
}

// Studio images
for (let i = 1; i <= 5; i++) {
  write(`studio/0${i}.svg`, studioImage(i))
  count++
}

// Brand mark + OG card
write(
  'mark.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="${C.void}"/>
  <path d="M44 22a14 14 0 1 0 0 20v-9h-11" fill="none" stroke="${C.brass}" stroke-width="5.5" stroke-linecap="square"/>
</svg>`,
)
count++

write(
  'og.svg',
  wrap(
    1200,
    630,
    [
      rect(0, 0, 1200, 630, C.void),
      text(72, 120, 'GENTECHNE', { size: 22, weight: 700, spacing: 8, fill: C.brass }),
      text(72, 300, 'BUILD', { size: 118, weight: 800, spacing: -5 }),
      text(72, 410, 'DIGITAL', { size: 118, weight: 800, spacing: -5 }),
      text(72, 520, 'WORLDS.', { size: 118, weight: 800, spacing: -5, fill: C.brass }),
      line(72, 560, 1128, 560, C.smoke, 1),
      mono(72, 592, 'DESIGN · CODE · MOTION — UNDER ONE ROOF', { size: 13, fill: C.silver }),
    ].join('\n'),
    { bg: C.void, id: 'og' },
  ),
)
count++

/* ── robots.txt + sitemap.xml, derived from the same data as the routes ── */
const SITE = 'https://gentechne.com'

write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
count++

const routes = [
  { loc: '/', priority: '1.0', freq: 'weekly' },
  { loc: '/work', priority: '0.9', freq: 'weekly' },
  { loc: '/contact', priority: '0.8', freq: 'monthly' },
  ...jobs
    .filter((j) => j.dir.startsWith('projects/'))
    .map((j) => ({ loc: `/work/${j.dir.split('/').pop()}`, priority: '0.7', freq: 'monthly' })),
]

write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) =>
      `  <url><loc>${SITE}${r.loc}</loc><changefreq>${r.freq}</changefreq><priority>${r.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`,
)
count++

console.log(`Generated ${count} placeholder assets into public/`)
