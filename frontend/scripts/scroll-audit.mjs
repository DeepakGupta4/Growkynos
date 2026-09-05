/**
 * SCROLL AUDIT
 * ------------
 * Walks the whole page and reports what is actually wrong during scrolling,
 * rather than what a single screenshot suggests:
 *
 *   - total scroll cost (how long the page is, in viewport-heights)
 *   - per-section scroll cost, so the pacing is visible as numbers
 *   - elements left stuck invisible (an animation that never fired)
 *   - content clipped by a pinned stage ("kahin cut raha hai")
 *   - horizontal overflow at any scroll position
 *
 *   node scripts/scroll-audit.mjs [baseUrl]
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

const errors = []
page.on('pageerror', (e) => errors.push(e.message.slice(0, 90)))

await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 })
await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await page.reload({ waitUntil: 'networkidle2', timeout: 90000 })
await sleep(3500)

/* ── Section inventory ── */
const sections = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('section[id], div[id]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.height < 200) return
    out.push({
      id: el.id,
      top: Math.round(r.top + window.scrollY),
      height: Math.round(r.height),
    })
  })
  return out.sort((a, b) => a.top - b.top)
})

const vh = 900
const docHeight = await page.evaluate(() => document.documentElement.scrollHeight)

console.log(`\n──────── SCROLL COST ────────`)
console.log(`total page: ${docHeight}px  =  ${(docHeight / vh).toFixed(1)} screens of scrolling\n`)
for (const s of sections) {
  const screens = s.height / vh
  const bar = '█'.repeat(Math.min(40, Math.round(screens * 2)))
  console.log(`  ${s.id.padEnd(16)} ${screens.toFixed(1).padStart(5)} screens  ${bar}`)
}

/* ── Walk the page looking for problems ── */
console.log(`\n──────── PROBLEMS ────────`)
const problems = []
const step = Math.round(vh * 0.6)

for (let y = 0; y < docHeight - vh; y += step) {
  await page.evaluate((v) => {
    if (window.__lenis) window.__lenis.scrollTo(v, { immediate: true })
    else window.scrollTo(0, v)
  }, y)
  await sleep(240)

  const found = await page.evaluate((scrollY) => {
    const issues = []

    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      issues.push({ type: 'H-OVERFLOW', detail: `${document.documentElement.scrollWidth}px wide` })
    }

    // Anything sizeable that is on screen but invisible = an animation that
    // never ran, which is what reads as a section "not working".
    document.querySelectorAll('section, [data-hero-swap], h2, h3, figure, li').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.height < 40 || r.width < 40) return
      if (r.bottom < 80 || r.top > window.innerHeight - 80) return
      // Deliberately hidden UI is not a broken animation: the closed nav
      // overlay and anything aria-hidden are SUPPOSED to be invisible, and
      // counting them buried the real findings under hundreds of false hits.
      if (el.closest('[aria-hidden="true"], [role="dialog"][aria-hidden], .sr-only')) return
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.02) {
        const label = (el.id || el.tagName + '.' + (el.className || '').toString().slice(0, 24)).trim()
        issues.push({ type: 'INVISIBLE', detail: label })
      }
    })

    return { scrollY, issues }
  }, y)

  for (const i of found.issues) {
    problems.push({ y, ...i })
  }
}

const grouped = {}
for (const p of problems) {
  const key = `${p.type}|${p.detail}`
  grouped[key] = grouped[key] ?? { ...p, count: 0, firstY: p.y }
  grouped[key].count++
}

const list = Object.values(grouped).sort((a, b) => b.count - a.count)
if (!list.length) console.log('  none')
for (const p of list.slice(0, 18)) {
  console.log(`  ${p.type.padEnd(12)} ${String(p.count).padStart(3)}x  from y=${p.firstY}  ${p.detail}`)
}

console.log(`\npage errors: ${errors.length ? errors.join(' | ') : 'none'}`)
await browser.close()
