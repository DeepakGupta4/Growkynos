/**
 * Service world artwork — GENTECHNE
 * ---------------------------------
 * Generates the eight environment plates that sit behind each service world.
 *
 * These are STAND-INS. Drop a real `app-development.png` (or .webp/.avif) into
 * public/assets/services/ and it wins automatically — the backdrop probes
 * raster formats before .svg, so there is nothing to delete.
 *
 * Composition rules these follow, because of how WorldBackdrop uses them:
 *   - 1920×1080, used with object-fit: cover and scaled ~6% past the frame
 *   - outer ~10% is cropped or edge-masked, so nothing important lives there
 *   - the plate is darkened to ~38% and tinted to the world accent, so these
 *     are built high-contrast and structural rather than detailed
 *
 *   node scripts/generate-service-art.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'public', 'assets', 'services')

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
  halo: '#9FB4C9',
  sage: '#A8C0A0',
  lilac: '#B0A8C8',
  rose: '#C8A0A0',
}

const W = 1920
const H = 1080

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

const f = (n) => (Number.isInteger(n) ? n : Number(n.toFixed(2)))
const rect = (x, y, w, h, fill, r = 0, o = 1) =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}"${
    o === 1 ? '' : ` opacity="${f(o)}"`
  }/>`
const circ = (cx, cy, r, fill, o = 1) =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${o === 1 ? '' : ` opacity="${f(o)}"`}/>`
const ring = (cx, cy, r, stroke, sw = 2, o = 1) =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${stroke}" stroke-width="${f(
    sw,
  )}"${o === 1 ? '' : ` opacity="${f(o)}"`}/>`
const line = (x1, y1, x2, y2, stroke, sw = 1, o = 1) =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${f(
    sw,
  )}"${o === 1 ? '' : ` opacity="${f(o)}"`}/>`
const path = (d, { fill = 'none', stroke = null, sw = 2, o = 1 } = {}) =>
  `<path d="${d}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${f(sw)}"` : ''}${
    o === 1 ? '' : ` opacity="${f(o)}"`
  } stroke-linecap="round" stroke-linejoin="round"/>`

/** Shared ground: gradient, horizon glow, perspective floor, grain. */
function shell(id, accent, body, { floor = true, seed = 1 } = {}) {
  const r = rng(seed)
  let grain = ''
  for (let i = 0; i < 700; i++) {
    grain += rect(r() * W, r() * H, 2, 2, r() > 0.55 ? C.bone : '#000', 0, r() * 0.05)
  }

  let floorLines = ''
  if (floor) {
    // Perspective floor converging on the horizon — gives every plate depth.
    const hz = H * 0.58
    for (let i = -14; i <= 14; i++) {
      const x = W / 2 + i * 150
      floorLines += line(W / 2 + i * 26, hz, x, H + 60, C.steel, 1, 0.16)
    }
    for (let i = 1; i <= 9; i++) {
      const t = i / 9
      const y = hz + Math.pow(t, 2.1) * (H - hz + 60)
      floorLines += line(0, y, W, y, C.steel, 1, 0.13 * (1 - t * 0.5))
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>
  <linearGradient id="${id}-g" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0%" stop-color="${C.graphite}"/>
    <stop offset="52%" stop-color="${C.carbon}"/>
    <stop offset="100%" stop-color="${C.void}"/>
  </linearGradient>
  <radialGradient id="${id}-key" cx="0.5" cy="0.34" r="0.62">
    <stop offset="0%" stop-color="${accent}" stop-opacity="0.4"/>
    <stop offset="55%" stop-color="${accent}" stop-opacity="0.09"/>
    <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="${id}-plate" x1="0" y1="0" x2="0.7" y2="1">
    <stop offset="0%" stop-color="${C.smoke}"/>
    <stop offset="100%" stop-color="${C.carbon}"/>
  </linearGradient>
  <linearGradient id="${id}-edge" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${accent}" stop-opacity="0.85"/>
    <stop offset="100%" stop-color="${accent}" stop-opacity="0.12"/>
  </linearGradient>
</defs>
${rect(0, 0, W, H, `url(#${id}-g)`)}
${rect(0, 0, W, H, `url(#${id}-key)`)}
${floorLines}
${body}
${grain}
<radialGradient id="${id}-vig" cx="0.5" cy="0.46" r="0.72">
  <stop offset="58%" stop-color="#000" stop-opacity="0"/>
  <stop offset="100%" stop-color="#000" stop-opacity="0.72"/>
</radialGradient>
${rect(0, 0, W, H, `url(#${id}-vig)`)}
</svg>`
}

/* ══════════════════════════════════════════════════════════
   01 — APP DEVELOPMENT: a signal field of UI in space
   ---------------------------------------------------------
   Deliberately contains NO phone. The foreground showcase already renders a
   real device dead centre; putting devices in the backdrop too produced
   duplicate phones competing at the same scale. The environment is instead the
   *space the UI travels through*, weighted to the edges so the centre stays
   clean for the subject.
   ══════════════════════════════════════════════════════════ */
function appDevelopment(accent) {
  const r = rng(hash('app'))
  let s = ''

  // Signal rings emanating from where the device will stand
  for (let i = 1; i <= 6; i++) {
    s += `<ellipse cx="960" cy="500" rx="${f(180 + i * 168)}" ry="${f(
      120 + i * 104,
    )}" fill="none" stroke="${accent}" stroke-width="1.3" opacity="${f(0.15 - i * 0.019)}"/>`
  }

  // UI fragments — pushed outside a centre exclusion zone
  const CLEAR_X = 430
  const CLEAR_Y = 400
  for (let i = 0; i < 34; i++) {
    const cx = 60 + r() * (W - 120)
    const cy = 70 + r() * (H - 140)
    // Keep the middle of the frame free for the live device.
    if (Math.abs(cx - 960) < CLEAR_X && Math.abs(cy - 500) < CLEAR_Y) continue
    const w = 96 + r() * 168
    const h = 44 + r() * 84
    const o = 0.2 + r() * 0.45
    s += rect(cx - w / 2, cy - h / 2, w, h, C.ash, 10, o * 0.85)
    s += `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(
      h,
    )}" rx="10" fill="none" stroke="${accent}" stroke-width="1.2" opacity="${f(o * 0.75)}"/>`
    s += rect(cx - w / 2 + 14, cy - h / 2 + 14, w * 0.46, 7, accent, 3.5, o * 0.9)
    s += rect(cx - w / 2 + 14, cy - h / 2 + 30, w * 0.66, 5, C.steel, 2.5, o * 0.7)
    if (h > 70) s += rect(cx - w / 2 + 14, cy - h / 2 + 44, w * 0.4, 5, C.steel, 2.5, o * 0.5)
    // Motion trail back toward the centre
    s += line(cx, cy, 960 + (cx - 960) * 0.42, 500 + (cy - 500) * 0.42, accent, 1, o * 0.16)
  }

  // Notification chips drifting at the outer edges
  for (let i = 0; i < 10; i++) {
    const cx = r() > 0.5 ? 90 + r() * 300 : W - 390 + r() * 300
    const cy = 90 + r() * (H - 180)
    const w = 130 + r() * 90
    const o = 0.16 + r() * 0.26
    s += rect(cx, cy, w, 44, C.ash, 22, o)
    s += circ(cx + 24, cy + 22, 11, accent, o * 1.2)
    s += rect(cx + 44, cy + 15, w - 66, 6, C.silver, 3, o * 0.9)
    s += rect(cx + 44, cy + 27, w - 96, 5, C.steel, 2.5, o * 0.6)
  }

  return shell('app', accent, s, { seed: hash('app-grain') })
}

/* ══════════════════════════════════════════════════════════
   02 — WEB DEVELOPMENT: browser frames receding, layers peeling out
   ══════════════════════════════════════════════════════════ */
function webDevelopment(accent) {
  const r = rng(hash('web'))
  let s = ''

  // Stacked browser planes in perspective
  const planes = [
    [960, 470, 1120, 660, 1, 0],
    [960, 470, 900, 530, 0.5, -1],
    [960, 470, 700, 412, 0.28, -2],
  ]
  planes.reverse().forEach(([cx, cy, w, h, o, depth]) => {
    const x = cx - w / 2 + depth * 34
    const y = cy - h / 2 + depth * 22
    s += rect(x, y, w, h, `url(#web-plate)`, 12, o)
    s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(
      h,
    )}" rx="12" fill="none" stroke="${accent}" stroke-width="${depth === 0 ? 2.2 : 1.2}" opacity="${f(
      o * 0.8,
    )}"/>`
    // Chrome bar
    s += rect(x, y, w, 42, C.graphite, 12, o)
    s += line(x, y + 42, x + w, y + 42, C.steel, 1, o * 0.7)
    ;[0, 1, 2].forEach((i) => {
      s += circ(x + 26 + i * 20, y + 21, 5.5, C.steel, o * 0.9)
    })
    s += rect(x + 100, y + 12, w * 0.44, 19, C.void, 9, o * 0.85)

    if (depth === 0) {
      // Site content inside the front plane
      s += rect(x + 54, y + 96, w * 0.4, 46, C.silver, 6, o * 0.42)
      s += rect(x + 54, y + 156, w * 0.28, 24, C.steel, 5, o * 0.5)
      s += rect(x + 54, y + 196, w * 0.2, 24, C.steel, 5, o * 0.35)
      s += rect(x + w * 0.55, y + 96, w * 0.38, 244, `url(#web-edge)`, 8, o * 0.5)
      for (let i = 0; i < 3; i++) {
        s += rect(x + 54 + i * (w * 0.29), y + 376, w * 0.25, 178, C.ash, 8, o * 0.85)
        s += rect(x + 54 + i * (w * 0.29), y + 376, w * 0.25, 96, C.smoke, 8, o * 0.7)
        s += rect(x + 70 + i * (w * 0.29), y + 490, w * 0.15, 8, C.steel, 4, o * 0.8)
      }
    }
  })

  // Layers escaping the frame
  const escapes = [
    [250, 300, 260, 168, -9],
    [1660, 340, 236, 152, 8],
    [206, 760, 224, 142, 7],
    [1700, 786, 250, 156, -6],
  ]
  escapes.forEach(([cx, cy, w, h, rot]) => {
    s += `<g transform="rotate(${rot} ${f(cx)} ${f(cy)})">`
    s += rect(cx - w / 2, cy - h / 2, w, h, C.ash, 10, 0.62)
    s += `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(
      h,
    )}" rx="10" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.6"/>`
    s += rect(cx - w / 2, cy - h / 2, w, h * 0.56, `url(#web-plate)`, 10, 0.75)
    s += rect(cx - w / 2 + 18, cy + h * 0.12, w * 0.55, 7, accent, 3.5, 0.7)
    s += rect(cx - w / 2 + 18, cy + h * 0.24, w * 0.34, 6, C.steel, 3, 0.6)
    s += '</g>'
  })

  // Connecting hairlines
  for (let i = 0; i < 5; i++) {
    const y = 200 + r() * 700
    s += line(0, y, W, y + (r() - 0.5) * 120, accent, 1, 0.07)
  }

  return shell('web', accent, s, { seed: hash('web-grain') })
}

/* ══════════════════════════════════════════════════════════
   03 — SHOPIFY: a storefront arcade of product plinths
   ══════════════════════════════════════════════════════════ */
function shopifyDevelopment(accent) {
  const r = rng(hash('shop'))
  let s = ''

  // Product plinths receding in two rows
  const cols = 7
  for (let i = 0; i < cols; i++) {
    const t = i / (cols - 1)
    const depth = Math.abs(t - 0.5) * 2
    const scale = 1 - depth * 0.52
    const cx = 150 + t * (W - 300)
    const cy = 500 + depth * 46
    const w = 210 * scale
    const h = 268 * scale
    const o = 1 - depth * 0.62

    s += rect(cx - w / 2, cy - h / 2, w, h, `url(#shop-plate)`, 10, o)
    s += `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(
      h,
    )}" rx="10" fill="none" stroke="${accent}" stroke-width="1.5" opacity="${f(o * 0.62)}"/>`
    // Product form
    s += rect(cx - w * 0.3, cy - h * 0.34, w * 0.6, h * 0.46, C.smoke, 6, o * 0.9)
    s += rect(cx - w * 0.3, cy - h * 0.34, w * 0.6, h * 0.46, accent, 6, o * 0.18)
    // Price tag
    s += rect(cx - w * 0.3, cy + h * 0.2, w * 0.34, h * 0.09, accent, h * 0.045, o * 0.9)
    s += rect(cx + w * 0.06, cy + h * 0.21, w * 0.22, h * 0.06, C.steel, h * 0.03, o * 0.6)
    // Reflection on the floor
    s += rect(cx - w / 2, cy + h / 2 + 6, w, h * 0.3, accent, 8, o * 0.08)
  }

  // Cart geometry, drawn large and centred
  const cx = 960
  const cy = 300
  s += path(
    `M ${cx - 96} ${cy - 54} L ${cx - 62} ${cy - 54} L ${cx - 30} ${cy + 42} L ${cx + 78} ${cy + 42} L ${
      cx + 104
    } ${cy - 22} L ${cx - 46} ${cy - 22}`,
    { stroke: accent, sw: 4.5, o: 0.72 },
  )
  s += ring(cx - 16, cy + 70, 13, accent, 4, 0.72)
  s += ring(cx + 66, cy + 70, 13, accent, 4, 0.72)

  // Floating price / conversion chips
  for (let i = 0; i < 12; i++) {
    const px = 120 + r() * (W - 240)
    const py = 120 + r() * 760
    const w = 96 + r() * 74
    const o = 0.14 + r() * 0.3
    s += rect(px, py, w, 38, C.ash, 19, o)
    s += `<rect x="${f(px)}" y="${f(py)}" width="${f(w)}" height="38" rx="19" fill="none" stroke="${accent}" stroke-width="1.2" opacity="${f(
      o * 0.9,
    )}"/>`
    s += circ(px + 19, py + 19, 5, accent, o * 1.1)
    s += rect(px + 34, py + 15, w - 52, 7, C.silver, 3.5, o * 0.9)
  }

  return shell('shop', accent, s, { seed: hash('shop-grain') })
}

/* ══════════════════════════════════════════════════════════
   04 — WORDPRESS: content blocks assembling into a page
   ══════════════════════════════════════════════════════════ */
function wordpressDevelopment(accent) {
  const r = rng(hash('wp'))
  let s = ''

  // The assembled page, centre
  const px = 660
  const py = 150
  const pw = 600
  const ph = 800
  s += rect(px, py, pw, ph, `url(#wp-plate)`, 10, 0.95)
  s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="10" fill="none" stroke="${accent}" stroke-width="2" opacity="0.66"/>`

  const rows = [
    [70, 'head'],
    [150, 'image'],
    [96, 'text'],
    [74, 'quote'],
    [140, 'cols'],
    [120, 'grid'],
  ]
  let y = py + 34
  rows.forEach(([h, kind], i) => {
    s += rect(px + 30, y, pw - 60, h, C.ash, 6, 0.94)
    s += `<rect x="${px + 30}" y="${f(y)}" width="${pw - 60}" height="${h}" rx="6" fill="none" stroke="${
      i === 1 ? accent : C.steel
    }" stroke-width="1.2" opacity="0.6"/>`
    if (kind === 'head') s += rect(px + 52, y + 24, (pw - 104) * 0.62, 20, C.silver, 10, 0.8)
    if (kind === 'image') s += rect(px + 52, y + 20, pw - 104, h - 40, `url(#wp-edge)`, 5, 0.5)
    if (kind === 'text')
      [0.86, 0.72, 0.5].forEach((wf, k) => {
        s += rect(px + 52, y + 24 + k * 22, (pw - 104) * wf, 9, C.steel, 4.5, 0.75)
      })
    if (kind === 'quote') {
      s += rect(px + 52, y + 18, 4, h - 36, accent, 2, 0.9)
      s += rect(px + 72, y + 26, (pw - 124) * 0.7, 9, C.steel, 4.5, 0.7)
      s += rect(px + 72, y + 46, (pw - 124) * 0.45, 9, C.steel, 4.5, 0.55)
    }
    if (kind === 'cols')
      [0, 1].forEach((k) => {
        s += rect(px + 52 + k * ((pw - 124) / 2 + 20), y + 20, (pw - 124) / 2, h - 40, C.smoke, 5, 0.8)
      })
    if (kind === 'grid')
      [0, 1, 2].forEach((k) => {
        s += rect(px + 52 + k * ((pw - 128) / 3 + 14), y + 20, (pw - 128) / 3, h - 40, C.smoke, 5, 0.8)
      })
    y += h + 16
  })

  // Detached blocks orbiting, mid-assembly
  const floats = [
    [250, 250, 280, 120, -8],
    [1640, 300, 250, 138, 9],
    [210, 640, 300, 128, 6],
    [1690, 690, 262, 116, -7],
    [330, 900, 236, 96, 4],
    [1560, 940, 246, 100, -5],
  ]
  floats.forEach(([cx, cy, w, h, rot], i) => {
    s += `<g transform="rotate(${rot} ${f(cx)} ${f(cy)})">`
    s += rect(cx - w / 2, cy - h / 2, w, h, C.ash, 8, 0.7)
    s += `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(
      h,
    )}" rx="8" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.68"/>`
    // Block handles
    ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      s += rect(cx + (sx * w) / 2 - 5, cy + (sy * h) / 2 - 5, 10, 10, accent, 2, 0.85)
    })
    s += rect(cx - w / 2 + 18, cy - h / 2 + 18, w * 0.44, 8, accent, 4, 0.75)
    s += rect(cx - w / 2 + 18, cy - h / 2 + 36, w * 0.66, 7, C.steel, 3.5, 0.6)
    s += rect(cx - w / 2 + 18, cy - h / 2 + 52, w * 0.5, 7, C.steel, 3.5, 0.45)
    s += '</g>'
    // Assembly trace back to the page
    s += line(cx, cy, cx < 960 ? px : px + pw, py + 120 + i * 110, accent, 1, 0.13)
  })

  return shell('wp', accent, s, { floor: false, seed: hash('wp-grain') })
}

/* ══════════════════════════════════════════════════════════
   05 — PHOTO EDITING: mask contours, curve, brush arcs
   ══════════════════════════════════════════════════════════ */
function photoEditing(accent) {
  const r = rng(hash('photo'))
  let s = ''

  // Large luminous subject form
  s += `<ellipse cx="900" cy="600" rx="300" ry="410" fill="${C.smoke}" opacity="0.7"/>`
  s += `<ellipse cx="920" cy="330" rx="160" ry="196" fill="${C.steel}" opacity="0.62"/>`
  s += `<ellipse cx="900" cy="600" rx="300" ry="410" fill="url(#photo-edge)" opacity="0.24"/>`

  // Selection contour (marching ants)
  s += `<ellipse cx="900" cy="560" rx="330" ry="450" fill="none" stroke="${C.bone}" stroke-width="2.6" stroke-dasharray="18 13" opacity="0.62"/>`
  // Inner feather contours
  for (let i = 1; i <= 3; i++) {
    s += `<ellipse cx="900" cy="560" rx="${330 - i * 26}" ry="${450 - i * 34}" fill="none" stroke="${accent}" stroke-width="1" opacity="${f(
      0.2 - i * 0.045,
    )}"/>`
  }

  // Brush strokes sweeping across
  s += path('M 210 880 C 420 700, 560 560, 760 420 C 900 320, 1060 300, 1220 360', {
    stroke: accent,
    sw: 26,
    o: 0.14,
  })
  s += path('M 210 880 C 420 700, 560 560, 760 420 C 900 320, 1060 300, 1220 360', {
    stroke: accent,
    sw: 3,
    o: 0.5,
  })
  s += path('M 1180 820 C 1340 740, 1450 640, 1520 500', { stroke: C.bone, sw: 16, o: 0.07 })

  // Curves panel, right
  const gx = 1440
  const gy = 220
  const gs = 300
  s += rect(gx, gy, gs, gs, C.void, 6, 0.62)
  s += `<rect x="${gx}" y="${gy}" width="${gs}" height="${gs}" rx="6" fill="none" stroke="${C.steel}" stroke-width="1.2" opacity="0.7"/>`
  for (let i = 1; i < 4; i++) {
    s += line(gx + (gs / 4) * i, gy, gx + (gs / 4) * i, gy + gs, C.steel, 1, 0.3)
    s += line(gx, gy + (gs / 4) * i, gx + gs, gy + (gs / 4) * i, C.steel, 1, 0.3)
  }
  s += line(gx, gy + gs, gx + gs, gy, C.steel, 1.2, 0.4)
  s += path(
    `M ${gx} ${gy + gs} C ${gx + gs * 0.34} ${gy + gs * 0.74}, ${gx + gs * 0.56} ${gy + gs * 0.3}, ${
      gx + gs
    } ${gy}`,
    { stroke: accent, sw: 3, o: 0.9 },
  )
  s += circ(gx + gs * 0.34, gy + gs * 0.72, 7, accent, 0.95)
  s += circ(gx + gs * 0.62, gy + gs * 0.34, 7, accent, 0.95)

  // Histogram, bottom right
  for (let i = 0; i < 46; i++) {
    const bh = 16 + Math.abs(Math.sin(i / 7)) * 96 + r() * 44
    s += rect(gx + i * 6.6, 900 - bh, 5, bh, C.silver, 1, 0.22)
  }

  // Before/after divider
  s += line(660, 60, 660, H - 60, C.bone, 2, 0.34)
  s += ring(660, 560, 26, C.bone, 2, 0.4)

  return shell('photo', accent, s, { floor: false, seed: hash('photo-grain') })
}

/* ══════════════════════════════════════════════════════════
   06 — VIDEO EDITING: timeline ribbons and waveform bands
   ══════════════════════════════════════════════════════════ */
/**
 * Contains NO monitor and NO horizontal timeline: the foreground showcase is
 * already a full NLE with both, and duplicating them produced a second
 * programme window and a double set of tracks directly behind the real ones.
 * The environment here is film *material* — sprocket strips, sweeping ribbons
 * and light — banded to the top and bottom so the centre stays clear.
 */
function videoEditing(accent) {
  const r = rng(hash('video'))
  let s = ''

  // Sweeping ribbons of footage crossing the frame
  const ribbons = [
    ['M -80 250 C 420 120, 1180 340, 2000 150', 96, 0.13],
    ['M -80 880 C 500 980, 1240 720, 2000 900', 122, 0.11],
    ['M -80 560 C 620 470, 1160 640, 2000 520', 58, 0.07],
  ]
  ribbons.forEach(([d, w, o]) => {
    s += path(d, { stroke: accent, sw: w, o })
    s += path(d, { stroke: accent, sw: 1.6, o: o * 3.4 })
  })

  // Film strips with sprocket holes, banded top and bottom
  const strips = [
    [0, 96, 118],
    [0, H - 214, 118],
  ]
  strips.forEach(([x, y, h]) => {
    s += rect(x, y, W, h, C.carbon, 0, 0.5)
    s += line(x, y, W, y, accent, 1.2, 0.3)
    s += line(x, y + h, W, y + h, accent, 1.2, 0.3)
    // Sprockets
    for (let i = 0; i < 46; i++) {
      s += rect(i * 42 + 10, y + 10, 20, 14, C.void, 3, 0.72)
      s += rect(i * 42 + 10, y + h - 24, 20, 14, C.void, 3, 0.72)
    }
    // Frames
    for (let i = 0; i < 15; i++) {
      s += rect(i * 130 + 16, y + 32, 112, h - 64, C.smoke, 2, 0.38)
      s += rect(i * 130 + 16, y + 32, 112, h - 64, accent, 2, 0.08)
    }
  })

  // Vertical light columns — playhead ghosts, not a timeline
  for (let i = 0; i < 7; i++) {
    const x = 150 + i * 270 + r() * 60
    s += rect(x, 0, 2, H, accent, 0, 0.07 + r() * 0.06)
  }

  // Waveform bands at the extreme edges
  ;[H - 74, 44].forEach((y, bi) => {
    let wf = ''
    for (let i = 0; i < W / 7; i++) {
      const a = Math.abs(Math.sin(i / 9 + bi)) * 26 * (0.35 + r() * 0.65)
      wf += `M${f(i * 7)} ${f(y - a)} L${f(i * 7)} ${f(y + a)} `
    }
    s += `<path d="${wf}" stroke="${C.sage}" stroke-width="1.4" opacity="0.2"/>`
  })

  // Colour-grade wheels, cornered
  ;[[190, 540], [W - 190, 540]].forEach(([cx, cy], i) => {
    s += ring(cx, cy, 96, accent, 1.4, 0.18)
    s += ring(cx, cy, 64, accent, 1, 0.12)
    s += circ(cx, cy, 44, accent, 0.05)
    s += circ(cx + (i ? 18 : -18), cy - 12, 7, accent, 0.3)
    s += line(cx - 110, cy, cx + 110, cy, C.steel, 1, 0.14)
    s += line(cx, cy - 110, cx, cy + 110, C.steel, 1, 0.14)
  })

  return shell('video', accent, s, { floor: false, seed: hash('video-grain') })
}

/* ══════════════════════════════════════════════════════════
   07 — BANNER / POSTER DESIGN: overlapping poster planes
   ══════════════════════════════════════════════════════════ */
function bannerPosterDesign(accent) {
  const r = rng(hash('design'))
  let s = ''

  // Baseline grid
  for (let i = 0; i <= 24; i++) s += line(i * 80, 0, i * 80, H, C.steel, 1, 0.09)
  for (let i = 0; i <= 14; i++) s += line(0, i * 80, W, i * 80, C.steel, 1, 0.09)

  // Poster planes at angles
  const posters = [
    [700, 540, 430, 574, -7, 1],
    [1180, 500, 372, 496, 6, 0.86],
    [330, 600, 300, 400, 9, 0.6],
    [1580, 620, 268, 356, -8, 0.5],
  ]
  posters.forEach(([cx, cy, w, h, rot, o], i) => {
    s += `<g transform="rotate(${rot} ${f(cx)} ${f(cy)})">`
    s += rect(cx - w / 2, cy - h / 2, w, h, C.carbon, 4, o)
    s += `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(
      h,
    )}" rx="4" fill="none" stroke="${accent}" stroke-width="1.6" opacity="${f(o * 0.6)}"/>`
    // Composition inside
    s += rect(cx - w / 2, cy - h / 2, w, h * 0.42, `url(#design-edge)`, 4, o * 0.42)
    s += rect(cx - w * 0.36, cy - h * 0.02, w * 0.62, h * 0.11, C.bone, 3, o * 0.72)
    s += rect(cx - w * 0.36, cy + h * 0.13, w * 0.4, h * 0.09, accent, 3, o * 0.8)
    s += rect(cx - w * 0.36, cy + h * 0.29, w * 0.5, h * 0.022, C.steel, 2, o * 0.7)
    s += rect(cx - w * 0.36, cy + h * 0.34, w * 0.34, h * 0.022, C.steel, 2, o * 0.55)
    s += ring(cx + w * 0.28, cy + h * 0.3, w * 0.09, accent, 2.4, o * 0.75)
    s += '</g>'
  })

  // Type-scale specimen strip
  const sizes = [96, 66, 46, 32, 22]
  let sy = 120
  sizes.forEach((sz, i) => {
    s += rect(120, sy, sz * 3.4, sz * 0.72, i === 0 ? accent : C.silver, 3, 0.2 - i * 0.028)
    sy += sz * 0.72 + 16
  })

  // Colour proof chips
  const chips = [accent, C.bone, C.halo, C.rose, C.sage, C.lilac]
  chips.forEach((c, i) => {
    s += rect(1640, 140 + i * 76, 150, 58, c, 3, 0.34)
    s += rect(1640, 140 + i * 76, 150, 58, '#000', 3, 0.12)
  })

  // Crop marks
  ;[[110, 110], [W - 110, 110], [110, H - 110], [W - 110, H - 110]].forEach(([x, y]) => {
    s += line(x - 30, y, x + 30, y, accent, 1.4, 0.4)
    s += line(x, y - 30, x, y + 30, accent, 1.4, 0.4)
  })

  return shell('design', accent, s, { floor: false, seed: hash('design-grain') })
}

/* ══════════════════════════════════════════════════════════
   08 — MORE SERVICES: a constellation of capability nodes
   ══════════════════════════════════════════════════════════ */
/**
 * Contains NO labelled nodes. The foreground of this section is itself an
 * orbital system of labelled capability pills; putting labelled node plates in
 * the artwork too produced large blurred pills competing with the real ones.
 * The environment is pure orbital geometry — arcs, ticks and a star field —
 * which reads as the space the system turns in.
 */
function moreServices(accent) {
  const r = rng(hash('more'))
  let s = ''
  const cx = 960
  const cy = 540

  // Concentric orbital arcs — partial, so they read as motion paths
  for (let i = 1; i <= 9; i++) {
    const rx = 150 + i * 148
    const ry = 92 + i * 88
    const o = 0.2 - i * 0.017
    // Draw each ellipse as two arcs with a gap, offset per ring
    const gap = 0.28 + r() * 0.5
    const start = r() * Math.PI * 2
    for (const dir of [0, 1]) {
      const a0 = start + dir * Math.PI + gap
      const a1 = start + dir * Math.PI + Math.PI - gap
      const x0 = cx + Math.cos(a0) * rx
      const y0 = cy + Math.sin(a0) * ry
      const x1 = cx + Math.cos(a1) * rx
      const y1 = cy + Math.sin(a1) * ry
      s += `<path d="M ${f(x0)} ${f(y0)} A ${f(rx)} ${f(ry)} 0 0 1 ${f(x1)} ${f(
        y1,
      )}" fill="none" stroke="${accent}" stroke-width="1.3" opacity="${f(Math.max(0.03, o))}"/>`
    }
  }

  // Radial tick marks — a dial, not a diagram
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    const inner = i % 6 === 0 ? 640 : 690
    const outer = 720
    s += line(
      cx + Math.cos(a) * inner * 1.6,
      cy + Math.sin(a) * inner * 0.95,
      cx + Math.cos(a) * outer * 1.6,
      cy + Math.sin(a) * outer * 0.95,
      accent,
      i % 6 === 0 ? 1.6 : 1,
      i % 6 === 0 ? 0.16 : 0.08,
    )
  }

  // Star field — depth without objects
  for (let i = 0; i < 220; i++) {
    const x = r() * W
    const y = r() * H
    const rad = 0.6 + r() * 1.9
    s += circ(x, y, rad, r() > 0.82 ? accent : C.bone, 0.06 + r() * 0.22)
  }

  // A few distant travelling marks on the outer arcs
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2
    const k = 3 + Math.floor(r() * 6)
    const x = cx + Math.cos(a) * (150 + k * 148)
    const y = cy + Math.sin(a) * (92 + k * 88)
    s += circ(x, y, 3.4, accent, 0.4)
    s += circ(x, y, 13, accent, 0.09)
  }

  // Hub glow only — no hub object, the foreground draws that
  s += `<radialGradient id="more-hub" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0%" stop-color="${accent}" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
  </radialGradient>`
  s += `<ellipse cx="${cx}" cy="${cy}" rx="520" ry="330" fill="url(#more-hub)"/>`

  return shell('more', accent, s, { floor: false, seed: hash('more-grain') })
}

/* ══════════════════════════════════════════════════════════ */

const JOBS = [
  ['app-development', appDevelopment, '#9FB4C9'],
  ['web-development', webDevelopment, '#9FB4C9'],
  ['shopify-development', shopifyDevelopment, '#A8C0A0'],
  ['wordpress-development', wordpressDevelopment, '#B0A8C8'],
  ['photo-editing', photoEditing, '#C8A0A0'],
  ['video-editing', videoEditing, '#B0A8C8'],
  ['banner-poster-design', bannerPosterDesign, '#D8C4A0'],
  ['more-services', moreServices, '#C6A87C'],
]

mkdirSync(OUT, { recursive: true })
for (const [name, fn, accent] of JOBS) {
  writeFileSync(resolve(OUT, `${name}.svg`), fn(accent), 'utf8')
  console.log(`  ${name}.svg`)
}
console.log(`\n${JOBS.length} service artworks written to public/assets/services/`)
