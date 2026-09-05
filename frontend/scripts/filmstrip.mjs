/**
 * FILMSTRIP
 * ---------
 * Captures the page the way a visitor experiences it — scrolling through, with
 * animations given time to play — so the whole journey can be reviewed instead
 * of one static screenshot.
 *
 * Stops at each named section and samples it mid-sequence, which is where a
 * pinned world actually shows its choreography.
 *
 *   node scripts/filmstrip.mjs <outDir> [baseUrl]
 */
import { existsSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] ?? './filmstrip'
const BASE = process.argv[3] ?? 'http://localhost:5173'
mkdirSync(OUT, { recursive: true })

const exe = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** section id → fractions through its pinned scroll worth sampling */
const STOPS = [
  ['hero', [0]],
  ['services', [0.4]],
  ['world-app', [0.25, 0.7]],
  ['world-web', [0.25, 0.7]],
  ['world-saas', [0.3, 0.75]],
  ['world-ai', [0.3, 0.75]],
  ['more-services', [0.4]],
  ['projects', [0.2, 0.55, 0.85]],
  ['studio', [0.25, 0.6]],
  ['technology', [0.45]],
  ['contact', [0.4]],
]

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 900 })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])

const errors = []
page.on('pageerror', (e) => errors.push(e.message.slice(0, 90)))

await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 })
await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await page.reload({ waitUntil: 'networkidle2', timeout: 90000 })
await sleep(4000)

let n = 0
for (const [id, fractions] of STOPS) {
  for (const f of fractions) {
    const y = await page.evaluate(
      (sid, frac) => {
        const el = document.getElementById(sid)
        if (!el) return null
        const top = el.getBoundingClientRect().top + window.scrollY
        const travel = Math.max(0, el.offsetHeight - window.innerHeight)
        return Math.round(top + travel * frac)
      },
      id,
      f,
    )
    if (y == null) {
      console.log(`  ${id}  NOT FOUND`)
      continue
    }

    await page.evaluate((v) => {
      if (window.__lenis) window.__lenis.scrollTo(v, { immediate: true })
      else window.scrollTo(0, v)
    }, y)
    // Long enough for a scrubbed timeline to settle at this position.
    await sleep(1500)

    const name = `${String(++n).padStart(2, '0')}-${id}-${Math.round(f * 100)}.png`
    await page.screenshot({ path: `${OUT}/${name}` })
    console.log(`  ${name}   @${y}px`)
  }
}

console.log(`\npage errors: ${errors.length ? errors.join(' | ') : 'none'}`)
await browser.close()
