/**
 * Captures each service world mid-sequence so the backdrop artwork can be
 * reviewed in situ (darkened + accent-tinted behind the live showcase), not as
 * a raw file. Scrolls via Lenis, which owns the scroll position.
 *
 *   node scripts/world-shots.mjs <outDir> [baseUrl]
 */
import { existsSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] ?? './worlds'
const BASE = process.argv[3] ?? 'http://localhost:5173'
mkdirSync(OUT, { recursive: true })

const exe = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** id → how far into that world's pinned scroll to sample (0-1). */
const WORLDS = [
  ['world-app', 0.3],
  ['world-web', 0.35],
  ['world-shopify', 0.3],
  ['world-wordpress', 0.4],
  ['world-saas', 0.3],
  ['world-design', 0.45],
  ['world-photo', 0.4],
  ['world-video', 0.35],
  ['world-ai', 0.4],
]

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 900 })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 })
await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await page.reload({ waitUntil: 'networkidle2', timeout: 90000 })
await sleep(3000)

for (const [id, at] of WORLDS) {
  const target = await page.evaluate(
    (sid, frac) => {
      const el = document.getElementById(sid)
      if (!el) return null
      const top = el.getBoundingClientRect().top + window.scrollY
      // Pinned sections reserve their scroll distance in the parent's height.
      const travel = Math.max(0, el.offsetHeight - window.innerHeight)
      return Math.round(top + travel * frac)
    },
    id,
    at,
  )

  if (target == null) {
    console.log(`  ${id}  SECTION NOT FOUND`)
    continue
  }

  await page.evaluate((y) => {
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
    else window.scrollTo(0, y)
  }, target)
  await sleep(1400)

  await page.screenshot({ path: `${OUT}/${id}.png` })
  console.log(`  ${id}  @ ${target}px`)
}

await browser.close()
console.log(`\nCaptured to ${OUT}`)
