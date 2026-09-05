/**
 * BLANK-STATE SCAN
 * ----------------
 * Finds the moments where a visitor is looking at almost nothing.
 *
 * The complaint "transitions ke beech blank aa jata hai" is measurable: at each
 * scroll position, count the content actually visible in the viewport (text and
 * media that is on screen and not transparent) and the fraction of the frame it
 * covers. A run of positions scoring near zero is a dead zone, and its scroll
 * offset tells you exactly which transition produced it.
 *
 *   node scripts/blank-scan.mjs [baseUrl]
 */
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const exe = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 900 })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 })
await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await page.reload({ waitUntil: 'networkidle2', timeout: 90000 })
await sleep(4000)

const docHeight = await page.evaluate(() => document.documentElement.scrollHeight)
const VH = 900
const STEP = 150

const samples = []
for (let y = 0; y < docHeight - VH; y += STEP) {
  await page.evaluate((v) => {
    if (window.__lenis) window.__lenis.scrollTo(v, { immediate: true })
    else window.scrollTo(0, v)
  }, y)
  await sleep(190)

  const s = await page.evaluate(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    let covered = 0
    let items = 0

    const visibleEnough = (el) => {
      let node = el
      let depth = 0
      while (node && depth < 12) {
        const cs = getComputedStyle(node)
        if (cs.visibility === 'hidden' || cs.display === 'none') return false
        if (Number(cs.opacity) < 0.12) return false
        node = node.parentElement
        depth++
      }
      return true
    }

    // Things that actually carry meaning to a reader. `span` is included
    // deliberately: much of the display typography here is set in spans, and
    // leaving it out reported a screen as empty while a section title was
    // plainly on it.
    document.querySelectorAll('h1,h2,h3,h4,p,img,video,svg,canvas,button,a,li,span').forEach((el) => {
      // Count only spans that carry their own text, not wrappers.
      if (el.tagName === 'SPAN' && !el.textContent.trim()) return
      const r = el.getBoundingClientRect()
      if (r.width < 24 || r.height < 12) return
      const top = Math.max(0, r.top)
      const bottom = Math.min(vh, r.bottom)
      const left = Math.max(0, r.left)
      const right = Math.min(vw, r.right)
      if (bottom <= top || right <= left) return
      if (!visibleEnough(el)) return
      // Ignore the full-bleed atmospheric layers — they are not content.
      if (r.width >= vw * 0.98 && r.height >= vh * 0.98) return
      items++
      covered += (bottom - top) * (right - left)
    })

    const active =
      [...document.querySelectorAll('section[id]')].find((el) => {
        const r = el.getBoundingClientRect()
        return r.top <= vh * 0.5 && r.bottom >= vh * 0.5
      })?.id ?? '—'

    return { items, coverage: covered / (vw * vh), active }
  })

  samples.push({ y, ...s })
}

/* A frame is "blank" when almost nothing meaningful is on screen. */
const BLANK_ITEMS = 6
const BLANK_COVER = 0.1

const blanks = samples.filter((s) => s.items <= BLANK_ITEMS || s.coverage < BLANK_COVER)

console.log(`\nscanned ${samples.length} positions across ${docHeight}px\n`)
console.log('──────── DEAD ZONES ────────')
if (!blanks.length) {
  console.log('  none — content is on screen throughout')
} else {
  // Group consecutive blank samples into runs.
  const runs = []
  let cur = null
  for (const b of blanks) {
    if (cur && b.y - cur.end <= STEP * 1.5) {
      cur.end = b.y
      cur.min = Math.min(cur.min, b.items)
    } else {
      if (cur) runs.push(cur)
      cur = { start: b.y, end: b.y, min: b.items, section: b.active }
    }
  }
  if (cur) runs.push(cur)

  for (const r of runs) {
    const px = r.end - r.start + STEP
    console.log(
      `  ${r.section.padEnd(16)} y=${String(r.start).padStart(6)}→${String(r.end).padStart(6)}` +
        `  (${(px / 900).toFixed(1)} screens blank, low of ${r.min} items)`,
    )
  }
}

const worst = [...samples].sort((a, b) => a.coverage - b.coverage).slice(0, 6)
console.log('\n──────── EMPTIEST FRAMES ────────')
for (const w of worst) {
  console.log(`  ${w.active.padEnd(16)} y=${String(w.y).padStart(6)}  ${w.items} items, ${(w.coverage * 100).toFixed(1)}% covered`)
}

await browser.close()
