/**
 * WORLD FIT
 * ---------
 * Walks each pinned service world through its scroll and reports how far the
 * subject overflows the stage that is meant to contain it.
 *
 * The worlds end on an "approach" beat that pushes the device toward the
 * viewer; the perspective magnification stacks on top of the authored scale,
 * and it is easy for that to finish past the frame rather than filling it. This
 * catches that, which a screenshot at the wrong scroll position will not.
 *
 *   node scripts/world-fit.mjs [baseUrl]
 */
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:5173'
const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

const b = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
})
const p = await b.newPage()
/* `node scripts/world-fit.mjs --mobile` walks the same worlds at phone size.
   The phone is where the stages are tightest, so it needs checking as often as
   the desktop does. */
const MOBILE = process.argv.includes('--mobile')
await p.setViewport(
  MOBILE
    ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { width: 1600, height: 900 },
)
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await p.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await p.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

/* How far does anything substantial inside the stage stick out of it? */
const overflowOf = (id) =>
  // eslint-disable-next-line no-undef
  document.getElementById(id) &&
  (() => {
    const sec = document.getElementById(id)
    const stage = [...sec.querySelectorAll('div')].find((d) =>
      String(d.className).includes('perspective-far'),
    )
    if (!stage) return null
    const s = stage.getBoundingClientRect()
    let top = 0
    let bottom = 0
    let worst = ''
    /* An element inside a clipping ancestor cannot visually escape the stage,
       however far its own box reaches. Counting those reported the page image
       scrolling inside the browser mock as a 500px overflow when the browser
       frame was hiding it perfectly. */
    const isClipped = (el) => {
      let n = el.parentElement
      while (n && n !== stage) {
        const o = getComputedStyle(n)
        if (/hidden|clip|auto|scroll/.test(o.overflow + o.overflowX + o.overflowY)) return true
        n = n.parentElement
      }
      return false
    }

    for (const el of stage.querySelectorAll('div, svg, img')) {
      if (el === stage) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) continue
      if (isClipped(el)) continue
      const r = el.getBoundingClientRect()
      // ignore full-bleed backdrops and anything tiny
      if (r.height < 60 || r.width >= s.width - 2) continue
      const t = Math.round(s.top - r.top)
      const bm = Math.round(r.bottom - s.bottom)
      if (t > top) { top = t; worst = String(el.className).slice(0, 34) }
      if (bm > bottom) bottom = bm
    }
    return { top: Math.max(0, top), bottom: Math.max(0, bottom), worst }
  })()

const WORLDS = ['world-app', 'world-web', 'world-saas', 'world-ai']
const VH = MOBILE ? 844 : 900
console.log(`
──────── WORLD FIT (${MOBILE ? '390×844' : '1600×900'}) ────────
`)
let bad = 0

for (const id of WORLDS) {
  const box = await p.evaluate((i) => {
    const el = document.getElementById(i)
    if (!el) return null
    return { top: Math.round(el.getBoundingClientRect().top + window.scrollY), h: el.offsetHeight }
  }, id)
  if (!box) { console.log(`  ${id.padEnd(12)} MISSING`); continue }

  let worstTop = 0
  let worstBottom = 0
  let at = ''
  for (let f = 0; f <= 8; f++) {
    const y = box.top + Math.max(0, box.h - VH) * (f / 8)
    await p.evaluate((v) => { if (window.__lenis) window.__lenis.scrollTo(v, { immediate: true, force: true }); else window.scrollTo(0, v) }, y)
    await new Promise((r) => setTimeout(r, 480))
    const o = await p.evaluate(overflowOf, id)
    if (!o) continue
    if (o.top > worstTop) { worstTop = o.top; at = `${Math.round((f / 8) * 100)}%` }
    if (o.bottom > worstBottom) worstBottom = o.bottom
  }

  const ok = worstTop <= 8 && worstBottom <= 8
  if (!ok) bad++
  console.log(
    `  ${id.padEnd(12)} cut top ${String(worstTop).padStart(4)}px   cut bottom ${String(worstBottom).padStart(4)}px   ${ok ? 'fits' : `OVERFLOWS (worst at ${at})`}`,
  )
}

console.log(`\n  ${bad === 0 ? 'PASS — every world stays inside its stage' : `${bad} world(s) overflow`}\n`)
await b.close()
