/**
 * Captures the cursor in each of its states, cropped tight so the shape itself
 * can be judged rather than guessed at from a full-page screenshot.
 *
 *   node scripts/cursor-shots.mjs <outDir> [baseUrl]
 */
import { existsSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] ?? './cursor'
const BASE = process.argv[3] ?? 'http://localhost:5173'
mkdirSync(OUT, { recursive: true })

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

const clip = (x, y, w, h) => ({
  x: Math.max(0, Math.round(x)),
  y: Math.max(0, Math.round(y)),
  width: w,
  height: h,
})

/* 1 — resting, over the hero statement */
await page.mouse.move(430, 420)
await sleep(700)
await page.screenshot({ path: `${OUT}/1-default.png` })

/* 2 — over the primary CTA */
const cta = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /START A PROJECT|BEGIN A PROJECT/i.test(x.innerText))
  if (!b) return null
  const r = b.getBoundingClientRect()
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
})
if (cta) {
  await page.mouse.move(cta.x, cta.y)
  await sleep(800)
  await page.screenshot({ path: `${OUT}/2-link.png` })
}

/* 3 — over a service card, where the label shows */
const base = await page.evaluate(() => {
  const e = document.getElementById('services')
  return Math.round(e.getBoundingClientRect().top + window.scrollY)
})
await page.evaluate((v) => {
  if (window.__lenis) window.__lenis.scrollTo(v, { immediate: true })
  else window.scrollTo(0, v)
}, base + 300)
await sleep(1500)

const card = await page.evaluate(() => {
  const el = document.querySelector('[data-plate-id=web]')
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
})
if (card) {
  await page.mouse.move(card.x, card.y)
  await sleep(900)
  await page.screenshot({ path: `${OUT}/3-view.png` })
}

console.log('captured cursor states')
await browser.close()
